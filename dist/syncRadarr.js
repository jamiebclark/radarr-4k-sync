"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const env_1 = require("./lib/env");
const error_1 = require("./lib/error");
const radarr_1 = require("./lib/radarr");
// Configuration
const auth = (0, radarr_1.getApiAuth)(process.env.SECONDARY_URL, process.env.SECONDARY_API_KEY, 'Secondary');
const listId = (0, env_1.getEnv)(process.env.SECONDARY_LIST_ID, 'Secondary List ID');
// Synchronize the Secondary instance based on the saved list
async function syncRadarr() {
    try {
        const secondaryMovies = await (0, radarr_1.fetchMovies)(auth);
        const secondaryListMovies = await (0, radarr_1.fetchMoviesFromList)(auth, listId);
        // Create a set of TMDB IDs from the Secondary list for quick lookup
        const secondaryListTmdbIds = new Set(secondaryListMovies.map((movie) => movie.tmdbId.toString()));
        // Check Secondary instance movies and un-monitor if not in the Secondary list
        for (const movie of secondaryMovies) {
            if (!secondaryListTmdbIds.has(movie.tmdbId.toString()) && movie.monitored) {
                console.log(`Movie ${movie.title} (ID: ${movie.id}, TMDB: ${movie.tmdbId}) is no longer in the Secondary list. Removing...`);
                await (0, radarr_1.removeMovie)(auth, movie);
            }
        }
    }
    catch (error) {
        console.error('Error during synchronization:', (0, error_1.getMessage)(error));
    }
}
// Run the sync process
syncRadarr().catch((err) => console.error('Unhandled error:', err));
