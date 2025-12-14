import fs from "fs";
import path from "path";

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
}

export class Logger {
  private logFilePath: string;
  private maxAgeDays: number = 7;

  constructor(logFileName: string = "sync-radarr.log", maxAgeDays: number = 7) {
    // Store logs in the root directory (same level as src/)
    this.logFilePath = path.resolve(__dirname, "../", logFileName);
    this.maxAgeDays = maxAgeDays;
    this.ensureLogFileExists();
  }

  private ensureLogFileExists() {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, "", "utf-8");
    }
  }

  private formatLogEntry(level: "INFO" | "WARN" | "ERROR", message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}\n`;
  }

  private writeToFile(entry: string) {
    try {
      fs.appendFileSync(this.logFilePath, entry, "utf-8");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  private parseLogEntry(line: string): LogEntry | null {
    // Format: [timestamp] [LEVEL] message
    const match = line.match(/^\[([^\]]+)\] \[([^\]]+)\] (.+)$/);
    if (!match) return null;

    return {
      timestamp: match[1],
      level: match[2] as "INFO" | "WARN" | "ERROR",
      message: match[3],
    };
  }

  private cleanupOldEntries() {
    try {
      if (!fs.existsSync(this.logFilePath)) return;

      const content = fs.readFileSync(this.logFilePath, "utf-8");
      const lines = content.split("\n").filter((line) => line.trim());

      // If file is empty or has no valid entries, skip cleanup
      if (lines.length === 0) return;

      const now = new Date();
      const maxAgeMs = this.maxAgeDays * 24 * 60 * 60 * 1000;

      const validEntries = lines.filter((line) => {
        const entry = this.parseLogEntry(line);
        if (!entry) return true; // Keep unparseable lines (shouldn't happen)

        const entryDate = new Date(entry.timestamp);
        const ageMs = now.getTime() - entryDate.getTime();
        return ageMs <= maxAgeMs;
      });

      // Only rewrite if we actually removed entries
      if (validEntries.length < lines.length) {
        const newContent =
          validEntries.length > 0 ? validEntries.join("\n") + "\n" : "";
        fs.writeFileSync(this.logFilePath, newContent, "utf-8");
      }
    } catch (error) {
      console.error("Failed to cleanup log file:", error);
    }
  }

  info(message: string) {
    const entry = this.formatLogEntry("INFO", message);
    this.writeToFile(entry);
    console.log(message);
  }

  warn(message: string) {
    const entry = this.formatLogEntry("WARN", message);
    this.writeToFile(entry);
    console.warn(message);
  }

  error(message: string) {
    const entry = this.formatLogEntry("ERROR", message);
    this.writeToFile(entry);
    console.error(message);
  }

  // Call this at the start of your script to clean up old entries
  initialize() {
    this.cleanupOldEntries();
  }
}

