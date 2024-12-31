import fs from 'fs';
import path from 'path';

/**
 * Recursively scans a directory and deletes any empty subfolders.
 * @param dir - The directory to scan.
 * @returns The number of empty directories deleted.
 */
export function deleteEmptySubfoldersSync(dir: string): number {
  let emptyFolderCount = 0;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    // Recursively handle subfolders
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subfolderPath = path.join(dir, entry.name);
        const deletedInSubfolder = deleteEmptySubfoldersSync(subfolderPath);

        // Check if the folder is empty after processing its contents
        const remainingEntries = fs.readdirSync(subfolderPath);

        if (remainingEntries.length === 0) {
          console.log(`Deleting: ${subfolderPath}`)
          fs.rmdirSync(subfolderPath);
          emptyFolderCount += 1;
        }

        // Add deleted subfolder count
        emptyFolderCount += deletedInSubfolder;
      }
    }
  } catch (err) {
    console.error(`Error processing directory "${dir}":`, err);
  }

  return emptyFolderCount;
}

