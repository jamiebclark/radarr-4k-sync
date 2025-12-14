"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Logger {
    constructor(logFileName = "sync-radarr.log", maxAgeDays = 7) {
        this.maxAgeDays = 7;
        // Store logs in the root directory (same level as src/)
        this.logFilePath = path_1.default.resolve(__dirname, "../", logFileName);
        this.maxAgeDays = maxAgeDays;
        this.ensureLogFileExists();
    }
    ensureLogFileExists() {
        const logDir = path_1.default.dirname(this.logFilePath);
        if (!fs_1.default.existsSync(logDir)) {
            fs_1.default.mkdirSync(logDir, { recursive: true });
        }
        if (!fs_1.default.existsSync(this.logFilePath)) {
            fs_1.default.writeFileSync(this.logFilePath, "", "utf-8");
        }
    }
    formatLogEntry(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}\n`;
    }
    writeToFile(entry) {
        try {
            fs_1.default.appendFileSync(this.logFilePath, entry, "utf-8");
        }
        catch (error) {
            console.error("Failed to write to log file:", error);
        }
    }
    parseLogEntry(line) {
        // Format: [timestamp] [LEVEL] message
        const match = line.match(/^\[([^\]]+)\] \[([^\]]+)\] (.+)$/);
        if (!match)
            return null;
        return {
            timestamp: match[1],
            level: match[2],
            message: match[3],
        };
    }
    cleanupOldEntries() {
        try {
            if (!fs_1.default.existsSync(this.logFilePath))
                return;
            const content = fs_1.default.readFileSync(this.logFilePath, "utf-8");
            const lines = content.split("\n").filter((line) => line.trim());
            // If file is empty or has no valid entries, skip cleanup
            if (lines.length === 0)
                return;
            const now = new Date();
            const maxAgeMs = this.maxAgeDays * 24 * 60 * 60 * 1000;
            const validEntries = lines.filter((line) => {
                const entry = this.parseLogEntry(line);
                if (!entry)
                    return true; // Keep unparseable lines (shouldn't happen)
                const entryDate = new Date(entry.timestamp);
                const ageMs = now.getTime() - entryDate.getTime();
                return ageMs <= maxAgeMs;
            });
            // Only rewrite if we actually removed entries
            if (validEntries.length < lines.length) {
                const newContent = validEntries.length > 0 ? validEntries.join("\n") + "\n" : "";
                fs_1.default.writeFileSync(this.logFilePath, newContent, "utf-8");
            }
        }
        catch (error) {
            console.error("Failed to cleanup log file:", error);
        }
    }
    info(message) {
        const entry = this.formatLogEntry("INFO", message);
        this.writeToFile(entry);
        console.log(message);
    }
    warn(message) {
        const entry = this.formatLogEntry("WARN", message);
        this.writeToFile(entry);
        console.warn(message);
    }
    error(message) {
        const entry = this.formatLogEntry("ERROR", message);
        this.writeToFile(entry);
        console.error(message);
    }
    // Call this at the start of your script to clean up old entries
    initialize() {
        this.cleanupOldEntries();
    }
}
exports.Logger = Logger;
