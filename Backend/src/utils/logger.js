// src/utils/logger.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, "..", "..", "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log file paths
const errorLogPath = path.join(logDir, "error.log");
const combinedLogPath = path.join(logDir, "combined.log");

// Simple logging functions
const getTimestamp = () => {
  return new Date().toISOString();
};

const appendToFile = (filePath, message) => {
  const logEntry = `${getTimestamp()} - ${message}\n`;
  fs.appendFileSync(filePath, logEntry);
};

// Create logger object
const logger = {
  info: (message) => {
    const formattedMessage = `[INFO] ${message}`;
    console.log(formattedMessage);
    appendToFile(combinedLogPath, formattedMessage);
  },

  error: (message) => {
    const formattedMessage = `[ERROR] ${message}`;
    console.error(formattedMessage);
    appendToFile(errorLogPath, formattedMessage);
    appendToFile(combinedLogPath, formattedMessage);
  },

  warn: (message) => {
    const formattedMessage = `[WARN] ${message}`;
    console.warn(formattedMessage);
    appendToFile(combinedLogPath, formattedMessage);
  },

  debug: (message) => {
    if (process.env.NODE_ENV !== "production") {
      const formattedMessage = `[DEBUG] ${message}`;
      console.debug(formattedMessage);
      appendToFile(combinedLogPath, formattedMessage);
    }
  },
};

export default logger;
