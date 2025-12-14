"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./lib/env");
const error_1 = require("./lib/error");
const files_1 = require("./lib/files");
// Ensures a consistent working directory
process.chdir(path_1.default.resolve(__dirname, '../'));
// Loads environment variables
dotenv_1.default.config();
const secondaryPath = (0, env_1.getEnv)(process.env.SECONDARY_ROOT);
function run() {
    console.log('Cleaning up Radarr folder');
    console.log('Deleting empty sub-folders...');
    const count = (0, files_1.deleteEmptySubfoldersSync)(secondaryPath);
    console.log(`Deleted ${count} empty folders`);
}
try {
    run();
}
catch (error) {
    console.error(`Failed to run cleanup scripts`, (0, error_1.getMessage)(error));
}
