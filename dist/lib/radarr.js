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
        baseURL: auth.baseUrl,
        params: { apikey: auth.apiKey }
    });
}
// Fetch all movies 
async function fetchMovies(auth) {
    try {
        const response = await getApi(auth).get('/movie');
        return response.data;
    }
    catch (error) {
        console.error('Error fetching movies from Secondary Radarr:', (0, error_1.getMessage)(error));
        throw error;
    }
}
// Fetch movies from the saved list
async function fetchMoviesFromList(auth, listId) {
    try {
        const response = await getApi(auth).get(`/list/${listId}/movie`);
        return response.data;
    }
    catch (error) {
        console.error('Error fetching movies from Secondary list:', (0, error_1.getMessage)(error));
        throw error;
    }
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
async function removeMovie(_auth, movie) {
    console.log('This would Remove: ' + movie.title);
    // Un-monitors
    // await updateMovieMonitoring(auth, movie.id, false);
    // // Deletes movie
    // await getApi(auth).delete(`/movie/${movie.id}`)
    // // Deletes movie folder
    // deleteMovieDirectory(getEnv(process.env.SECONDARY_ROOT, 'Secondary Root'), movie)
}
