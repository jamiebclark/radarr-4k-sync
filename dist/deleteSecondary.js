"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./lib/env");
/**
 * Reads a directory and retrieves a list of movies.
 * @param rootDir The root directory to search for movies.
 * @returns An array of Movie objects.
 */
async function getMovies(rootDir) {
    const movieDirs = await promises_1.default.readdir(rootDir, { withFileTypes: true });
    const movies = [];
    for (const dir of movieDirs) {
        if (dir.isDirectory()) {
            const moviePath = path_1.default.join(rootDir, dir.name);
            movies.push({ title: dir.name, path: moviePath });
        }
    }
    return movies;
}
/**
 * Deletes a directory and its contents.
 * @param dirPath The path of the directory to delete.
 */
async function deleteDirectory(dirPath) {
    try {
        await promises_1.default.rm(dirPath, { recursive: true, force: true });
        console.log(`Deleted: ${dirPath}`);
    }
    catch (error) {
        console.error(`Failed to delete ${dirPath}:`, error);
    }
}
/**
 * Synchronizes deletions between two movie directories.
 * If a movie in `primaryMoviesDir` is missing, the corresponding movie in `secondaryMoviesDir` is deleted.
 * @param primaryMoviesDir The directory containing Primary Radarr movies.
 * @param secondaryMoviesDir The directory containing Secondary Radarr movies.
 */
async function syncDeletedMovies(primaryMoviesDir, secondaryMoviesDir) {
    const primaryMovies = await getMovies(primaryMoviesDir);
    const secondaryMovies = await getMovies(secondaryMoviesDir);
    const primaryTitles = new Set(primaryMovies.map((movie) => movie.title));
    for (const movie of secondaryMovies) {
        if (!primaryTitles.has(movie.title)) {
            await deleteDirectory(movie.path);
        }
    }
}
/**
 * Entry point for the script.
 */
async function main() {
    const primaryMoviesDir = (0, env_1.getEnv)(process.env.BASE_ROOT, 'Primary Library Root');
    const secondaryMoviesDir = (0, env_1.getEnv)(process.env.SECONDARY_ROOT, 'Secondary Library Root');
    console.log("Starting synchronization...");
    await syncDeletedMovies(primaryMoviesDir, secondaryMoviesDir);
    console.log("Synchronization complete.");
}
main().catch((error) => {
    console.error("An error occurred:", error);
});
