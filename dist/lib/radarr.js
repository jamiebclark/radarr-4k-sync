"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiAuth = getApiAuth;
exports.getApi = getApi;
exports.fetchMovies = fetchMovies;
exports.fetchMoviesFromList = fetchMoviesFromList;
exports.updateMovieMonitoring = updateMovieMonitoring;
exports.deleteMovieDirectory = deleteMovieDirectory;
exports.removeMovie = removeMovie;
exports.fetchDownloadingMovieIds = fetchDownloadingMovieIds;
exports.stopMovieDownload = stopMovieDownload;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./env");
const error_1 = require("./error");
function getApiAuth(url, apiKey, label = 'API') {
    return { baseUrl: (0, env_1.getEnv)(url, `${label} URL`), apiKey: (0, env_1.getEnv)(apiKey, `${label} API key`) };
}
function getApi(auth) {
    return axios_1.default.create({
        baseURL: path_1.default.join(auth.baseUrl, '/api/v3/'),
        params: { apikey: auth.apiKey },
        headers: {
            'X-Api-Key': auth.apiKey
        }
    });
}
// Fetch all movies 
async function fetchMovies(auth) {
    try {
        const response = await getApi(auth).get('/movie');
        return response.data;
    }
    catch (error) {
        console.error('Error fetching movies from Radarr:', (0, error_1.getMessage)(error));
        throw error;
    }
}
// Fetch movies from the saved list
async function fetchMoviesFromList(auth, listId) {
    let movies;
    try {
        const response = await getApi(auth).get(`/importlist/movie`);
        movies = response.data;
    }
    catch (error) {
        console.error('Error fetching movies from list:', (0, error_1.getMessage)(error));
        throw error;
    }
    return movies.filter((movie) => movie.lists?.includes(listId));
}
// Update monitoring status in the Secondary instance
async function updateMovieMonitoring(auth, movieId, monitored) {
    try {
        await getApi(auth).put('/movie/editor', { movieIds: [movieId], monitored });
        console.log(`Updated monitoring for movieId ${movieId} to ${monitored}`);
    }
    catch (error) {
        console.error(`Error updating monitoring for movieId ${movieId}:`, (0, error_1.getMessage)(error));
    }
}
function deleteMovieDirectory(rootFolder, movie) {
    const movieFolderPath = path_1.default.join(rootFolder, movie.title);
    if (!fs_1.default.existsSync(movieFolderPath)) {
        return;
    }
    try {
        fs_1.default.rmSync(movieFolderPath, { recursive: true, force: true });
        console.log(`Deleted movie folder: ${movieFolderPath}`);
    }
    catch (error) {
        console.error(`Error deleting folder ${movieFolderPath}:`, (0, error_1.getMessage)(error));
    }
}
async function removeMovie(auth, movie) {
    // Un-monitors
    console.log('Unmonitoring');
    await updateMovieMonitoring(auth, movie.id, false);
    // Deletes movie
    console.log('Deleting from Database');
    await getApi(auth).delete(`/movie/${movie.id}`);
    // Deletes movie folder
    console.log('Deleting files');
    deleteMovieDirectory((0, env_1.getEnv)(process.env.SECONDARY_ROOT, 'Secondary Root'), movie);
    // Halts any active downloads
    console.log('Halting downloads');
    await stopMovieDownload(auth, movie.id);
}
async function fetchDownloadingMovieIds(auth) {
    try {
        const response = await getApi(auth).get('/queue/details');
        return response.data;
    }
    catch (error) {
        console.error(`Error fetching download queue movies:`, (0, error_1.getMessage)(error));
        throw error;
    }
}
async function stopMovieDownload(auth, movieId) {
    const queueDetails = await fetchDownloadingMovieIds(auth);
    const queueIds = queueDetails.filter((detail) => detail.movieId === movieId).map(({ id }) => id);
    for (let queueId of queueIds) {
        console.log(`Stopping Download for: ${queueId}`);
        await getApi(auth).delete(`/queue/${queueId}`);
    }
    console.log(`Stopped ${queueIds.length} active downloads`);
}
