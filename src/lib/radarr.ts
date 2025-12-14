import axios from "axios";
import fs from "fs";
import path from "path";
import { getEnv } from "./env";
import { getMessage } from "./error";

export interface Movie {
  id: number;
  title: string;
  tmdbId: string;
  monitored: boolean;
  lists?: number[];
  path: string;
  rootFolderPath: string;
}

interface QueueDetails {
  id: number;
  movieId?: number;
}

export interface ApiAuth {
  baseUrl: string;
  apiKey: string;
}

export function getApiAuth(
  url?: string,
  apiKey?: string,
  label: string = "API"
): ApiAuth {
  return {
    baseUrl: getEnv(url, `${label} URL`),
    apiKey: getEnv(apiKey, `${label} API key`),
  };
}

export function getApi(auth: ApiAuth) {
  return axios.create({
    baseURL: path.join(auth.baseUrl, "/api/v3/"),
    params: { apikey: auth.apiKey },
    headers: {
      "X-Api-Key": auth.apiKey,
    },
  });
}

// Fetch all movies
export async function fetchMovies(auth: ApiAuth): Promise<Movie[]> {
  try {
    const response = await getApi(auth).get("/movie");
    return response.data;
  } catch (error) {
    console.error("Error fetching movies from Radarr:", getMessage(error));
    throw error;
  }
}

// Fetch movies from the saved list
export async function fetchMoviesFromList(
  auth: ApiAuth,
  listId: number
): Promise<Movie[]> {
  let movies: Movie[];
  try {
    const response = await getApi(auth).get(`/importlist/movie`);
    movies = response.data;
  } catch (error) {
    console.error("Error fetching movies from list:", getMessage(error));
    throw error;
  }
  return movies.filter((movie) => movie.lists?.includes(listId));
}

// Update monitoring status in the Secondary instance
export async function updateMovieMonitoring(
  auth: ApiAuth,
  movieId: number,
  monitored: boolean
) {
  try {
    await getApi(auth).put("/movie/editor", { movieIds: [movieId], monitored });
    console.log(`Updated monitoring for movieId ${movieId} to ${monitored}`);
  } catch (error) {
    console.error(
      `Error updating monitoring for movieId ${movieId}:`,
      getMessage(error)
    );
  }
}

export function getMovieSubfolder(movie: Movie) {
  return movie.path.substring(movie.rootFolderPath.length);
}

export function deleteMovieDirectory(rootFolder: string, movie: Movie) {
  const movieFolderPath = path.join(rootFolder, getMovieSubfolder(movie));

  console.log(`Deleting movie folder: "${movieFolderPath}"`);
  if (!fs.existsSync(movieFolderPath)) {
    console.log("Folder does not exist. Skipping.");
    return;
  }

  try {
    fs.rmSync(movieFolderPath, { recursive: true, force: true });
    console.log(`Deleted movie folder`);
  } catch (error) {
    console.error(
      `Error deleting folder ${movieFolderPath}:`,
      getMessage(error)
    );
  }
}

export async function removeMovie(
  auth: ApiAuth,
  movie: Movie,
  dryRun: boolean = false
) {
  if (dryRun) {
    console.log("DRY RUN: Would unmonitor movie");
    console.log("DRY RUN: Would halt any active downloads");
    console.log("DRY RUN: Would delete from Database");
    const rootFolder = getEnv(process.env.SECONDARY_ROOT, "Secondary Root");
    const movieFolderPath = path.join(rootFolder, getMovieSubfolder(movie));
    console.log(`DRY RUN: Would delete movie folder: "${movieFolderPath}"`);
    return;
  }

  // Un-monitors
  console.log("Unmonitoring");
  await updateMovieMonitoring(auth, movie.id, false);

  // Halts any active downloads
  console.log("Halting downloads");
  await stopMovieDownload(auth, movie.id);

  // Deletes movie
  console.log("Deleting from Database");
  await getApi(auth).delete(`/movie/${movie.id}`);

  // Deletes movie folder
  console.log("Deleting files");
  deleteMovieDirectory(
    getEnv(process.env.SECONDARY_ROOT, "Secondary Root"),
    movie
  );
}

export async function fetchDownloadingMovieIds(
  auth: ApiAuth
): Promise<QueueDetails[]> {
  try {
    const response = await getApi(auth).get("/queue/details");
    return response.data;
  } catch (error) {
    console.error(`Error fetching download queue movies:`, getMessage(error));
    throw error;
  }
}

export async function stopMovieDownload(auth: ApiAuth, movieId: number) {
  const queueDetails = await fetchDownloadingMovieIds(auth);
  const queueIds = queueDetails
    .filter((detail) => detail.movieId === movieId)
    .map(({ id }) => id);

  for (let queueId of queueIds) {
    console.log(`Stopping Download for: ${queueId}`);
    await getApi(auth).delete(`/queue/${queueId}`);
  }

  console.log(`Stopped ${queueIds.length} active downloads`);
}
