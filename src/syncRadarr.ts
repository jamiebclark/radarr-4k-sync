import dotenv from "dotenv";
import path from "path";
import { getEnv } from "./lib/env";
import { getMessage } from "./lib/error";
import { Logger } from "./lib/logger";
import {
  fetchMovies,
  fetchMoviesFromList,
  getApiAuth,
  removeMovie,
} from "./lib/radarr";

// Ensures a consistent working directory
process.chdir(path.resolve(__dirname, "../"));

// Loads environment variables
dotenv.config();

// Configuration
const auth = getApiAuth(
  process.env.SECONDARY_URL,
  process.env.SECONDARY_API_KEY,
  "Secondary"
);
const listId = parseInt(
  getEnv(process.env.SECONDARY_LIST_ID, "Secondary List ID"),
  10
);

// Initialize logger with auto-cleanup of entries older than 7 days
const logger = new Logger("sync-radarr.log", 7);

// Synchronize the Secondary instance based on the saved list
async function syncRadarr() {
  // Initialize logger and clean up old entries
  logger.initialize();
  logger.info("Starting Radarr sync process");

  let count: number = 0;

  try {
    const secondaryMovies = await fetchMovies(auth);
    const secondaryListMovies = await fetchMoviesFromList(auth, listId);

    logger.info(
      `Comparing ${secondaryMovies.length} movies in library to ${secondaryListMovies.length} movies on List`
    );

    // Safety check: Prevent deletion if list is empty (could indicate connection failure or invalid list)
    if (secondaryListMovies.length === 0) {
      const errorMsg =
        "List is empty or could not be fetched. Aborting sync to prevent accidental deletion of all movies. This could indicate: List connection failed, List ID is incorrect, List is empty, or API returned empty data.";
      logger.error(errorMsg);
      process.exit(1);
    }

    // Create a set of TMDB IDs from the Secondary list for quick lookup
    const secondaryListTmdbIds = new Set(
      secondaryListMovies.map((movie: any) => movie.tmdbId.toString())
    );

    // Safety check: Prevent deletion if more than 50% of movies would be deleted
    // This is a safeguard against catastrophic failures
    const moviesToDelete = secondaryMovies.filter(
      (movie) =>
        !secondaryListTmdbIds.has(movie.tmdbId.toString()) && movie.monitored
    );
    const deletionPercentage =
      (moviesToDelete.length / secondaryMovies.length) * 100;

    if (deletionPercentage > 50) {
      const errorMsg = `Would delete ${
        moviesToDelete.length
      } movies (${deletionPercentage.toFixed(
        1
      )}% of library). This exceeds the safety threshold of 50%. Aborting to prevent accidental mass deletion.`;
      logger.error(errorMsg);
      process.exit(1);
    }

    // Check Secondary instance movies and un-monitor if not in the Secondary list
    for (const movie of moviesToDelete) {
      const deletionMsg = `Deleting movie: ${movie.title} (ID: ${movie.id}, TMDB: ${movie.tmdbId}) - No longer in list`;
      logger.info(deletionMsg);
      try {
        await removeMovie(auth, movie);
        count += 1;
      } catch (error) {
        logger.error(
          `Failed to delete movie ${movie.title} (ID: ${
            movie.id
          }): ${getMessage(error)}`
        );
      }
    }
  } catch (error) {
    const errorMsg = `Error during synchronization: ${getMessage(error)}`;
    logger.error(errorMsg);
    process.exit(1);
  }

  logger.info(
    `Sync completed: Removed ${count} movies that are no longer on the list`
  );
}

// Run the sync process
syncRadarr().catch((err) => {
  const errorMsg = `Unhandled error: ${getMessage(err)}`;
  logger.error(errorMsg);
  process.exit(1);
});
