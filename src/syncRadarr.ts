import 'dotenv/config';
import { getEnv } from './lib/env';
import { getMessage } from './lib/error';
import { fetchMovies, fetchMoviesFromList, getApiAuth, removeMovie } from './lib/radarr';

// Configuration
const auth = getApiAuth(process.env.SECONDARY_URL, process.env.SECONDARY_API_KEY, 'Secondary')
const listId = parseInt(getEnv(process.env.SECONDARY_LIST_ID, 'Secondary List ID'), 10)

// Synchronize the Secondary instance based on the saved list
async function syncRadarr() {
  let count: number = 0;

  try {
    const secondaryMovies = await fetchMovies(auth);
    const secondaryListMovies = await fetchMoviesFromList(auth, listId);

    console.log(`Comparing ${secondaryMovies.length} movies in library to ${secondaryListMovies.length} movies on List`)

    // Create a set of TMDB IDs from the Secondary list for quick lookup
    const secondaryListTmdbIds = new Set(secondaryListMovies.map((movie: any) => movie.tmdbId.toString()));

    // Check Secondary instance movies and un-monitor if not in the Secondary list
    for (const movie of secondaryMovies) {
      if (!secondaryListTmdbIds.has(movie.tmdbId.toString()) && movie.monitored) {
        console.log(
          `Movie ${movie.title} (ID: ${movie.id}, TMDB: ${movie.tmdbId}) is no longer in the list. Removing...`
        );
        await removeMovie(auth, movie)
        count += 1;
      }
    }
  } catch (error) {
    console.error('Error during synchronization:', getMessage(error));
  }

  console.log(`Removed ${count} movies that are no longer on the list`)
}

// Run the sync process
syncRadarr().catch((err) => console.error('Unhandled error:', err));
