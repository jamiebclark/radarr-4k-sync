"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./lib/env");
const error_1 = require("./lib/error");
const logger_1 = require("./lib/logger");
const radarr_1 = require("./lib/radarr");
// Ensures a consistent working directory
process.chdir(path_1.default.resolve(__dirname, "../"));
// Loads environment variables
dotenv_1.default.config();
// Configuration
const auth = (0, radarr_1.getApiAuth)(process.env.SECONDARY_URL, process.env.SECONDARY_API_KEY, "Secondary");
const listId = parseInt((0, env_1.getEnv)(process.env.SECONDARY_LIST_ID, "Secondary List ID"), 10);
// Initialize logger with auto-cleanup of entries older than 7 days
const logger = new logger_1.Logger("sync-radarr.log", 7);
// Synchronize the Secondary instance based on the saved list
async function syncRadarr() {
    // Initialize logger and clean up old entries
    logger.initialize();
    logger.info("Starting Radarr sync process");
    let count = 0;
    try {
        const secondaryMovies = await (0, radarr_1.fetchMovies)(auth);
        const secondaryListMovies = await (0, radarr_1.fetchMoviesFromList)(auth, listId);
        logger.info(`Comparing ${secondaryMovies.length} movies in library to ${secondaryListMovies.length} movies on List`);
        // Safety check: Prevent deletion if list is empty (could indicate connection failure or invalid list)
        if (secondaryListMovies.length === 0) {
            const errorMsg = "List is empty or could not be fetched. Aborting sync to prevent accidental deletion of all movies. This could indicate: List connection failed, List ID is incorrect, List is empty, or API returned empty data.";
            logger.error(errorMsg);
            process.exit(1);
        }
        // Create a set of TMDB IDs from the Secondary list for quick lookup
        const secondaryListTmdbIds = new Set(secondaryListMovies.map((movie) => movie.tmdbId.toString()));
        // Safety check: Prevent deletion if more than 50% of movies would be deleted
        // This is a safeguard against catastrophic failures
        const moviesToDelete = secondaryMovies.filter((movie) => !secondaryListTmdbIds.has(movie.tmdbId.toString()) && movie.monitored);
        const deletionPercentage = (moviesToDelete.length / secondaryMovies.length) * 100;
        if (deletionPercentage > 50) {
            const errorMsg = `Would delete ${moviesToDelete.length} movies (${deletionPercentage.toFixed(1)}% of library). This exceeds the safety threshold of 50%. Aborting to prevent accidental mass deletion.`;
            logger.error(errorMsg);
            process.exit(1);
        }
        // Check Secondary instance movies and un-monitor if not in the Secondary list
        for (const movie of moviesToDelete) {
            const deletionMsg = `Deleting movie: ${movie.title} (ID: ${movie.id}, TMDB: ${movie.tmdbId}) - No longer in list`;
            logger.info(deletionMsg);
            try {
                await (0, radarr_1.removeMovie)(auth, movie);
                count += 1;
            }
            catch (error) {
                logger.error(`Failed to delete movie ${movie.title} (ID: ${movie.id}): ${(0, error_1.getMessage)(error)}`);
            }
        }
    }
    catch (error) {
        const errorMsg = `Error during synchronization: ${(0, error_1.getMessage)(error)}`;
        logger.error(errorMsg);
        process.exit(1);
    }
    logger.info(`Sync completed: Removed ${count} movies that are no longer on the list`);
}
// Run the sync process
syncRadarr().catch((err) => {
    const errorMsg = `Unhandled error: ${(0, error_1.getMessage)(err)}`;
    logger.error(errorMsg);
    process.exit(1);
});
