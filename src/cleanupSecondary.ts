import dotenv from 'dotenv';
import path from 'path';
import { getEnv } from './lib/env';
import { getMessage } from './lib/error';
import { deleteEmptySubfoldersSync } from './lib/files';

// Ensures a consistent working directory
process.chdir(path.resolve(__dirname, '../'))

// Loads environment variables
dotenv.config();

const secondaryPath = getEnv(process.env.SECONDARY_ROOT)
function run() {
  console.log('Cleaning up Radarr folder')

  console.log('Deleting empty sub-folders...')
  const count = deleteEmptySubfoldersSync(secondaryPath)
  console.log(`Deleted ${count} empty folders`)
}

try {
  run()
} catch (error) {
  console.error(`Failed to run cleanup scripts`, getMessage(error))
}