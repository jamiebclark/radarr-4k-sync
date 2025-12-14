"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmptySubfoldersSync = deleteEmptySubfoldersSync;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Recursively scans a directory and deletes any empty subfolders.
 * @param dir - The directory to scan.
 * @returns The number of empty directories deleted.
 */
function deleteEmptySubfoldersSync(dir) {
    let emptyFolderCount = 0;
    try {
        const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
        // Recursively handle subfolders
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subfolderPath = path_1.default.join(dir, entry.name);
                const deletedInSubfolder = deleteEmptySubfoldersSync(subfolderPath);
                // Check if the folder is empty after processing its contents
                const remainingEntries = fs_1.default.readdirSync(subfolderPath);
                if (remainingEntries.length === 0) {
                    console.log(`Deleting: ${subfolderPath}`);
                    fs_1.default.rmdirSync(subfolderPath);
                    emptyFolderCount += 1;
                }
                // Add deleted subfolder count
                emptyFolderCount += deletedInSubfolder;
            }
        }
    }
    catch (err) {
        console.error(`Error processing directory "${dir}":`, err);
    }
    return emptyFolderCount;
}
