// src/utils/cronScheduler.js
import cron from "node-cron";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup all cron jobs for the application
 */
export const setupCronJobs = () => {
  logger.info("Setting up cron jobs...");

  // Run the unpaid bookings cleanup job every hour
  // This will automatically cancel bookings with pending payments older than 6 hours
  cron.schedule("0 * * * *", () => {
    logger.info("Running scheduled task: Release unpaid bookings");

    // Get the path to the script
    const scriptPath = path.join(
      __dirname,
      "..",
      "..",
      "scripts",
      "releaseUnpaidBookings.js"
    );

    // Execute the script using Node
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        logger.error(
          `Error executing unpaid bookings cleanup: ${error.message}`
        );
        return;
      }

      if (stderr) {
        logger.warn(`Unpaid bookings cleanup stderr: ${stderr}`);
      }

      logger.info(`Unpaid bookings cleanup completed successfully: ${stdout}`);
    });
  });

  // Add more cron jobs here as needed

  logger.info("Cron jobs setup completed");
};
