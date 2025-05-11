import twilio from "twilio";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Debug current working directory
console.log("sendSMS.js - Current working directory:", process.cwd());

// Try loading env directly first - this will use env vars already set in Docker
dotenv.config();

// Try various potential env file locations
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), ".env.prod"),
  path.resolve(process.cwd(), "src", ".env"),
];

let envFileFound = false;

// Try each potential path
for (const envPath of envPaths) {
  console.log("sendSMS.js - Checking for env file at:", envPath);
  if (fs.existsSync(envPath)) {
    console.log("sendSMS.js - Found env file at:", envPath);
    dotenv.config({ path: envPath });
    envFileFound = true;
    break;
  }
}

if (!envFileFound) {
  console.log(
    "sendSMS.js - No .env file found, using environment variables from container"
  );
}

// Debug loaded environment variables
console.log("sendSMS.js - Loaded environment variables:", {
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? "****" : undefined,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? "****" : undefined,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || undefined,
});

// Verify required environment variables
const requiredEnvVars = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn(
    `sendSMS.js - Missing environment variables: ${missingVars.join(", ")}`
  );
}

// Create Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const sendSMS = async (to, message) => {
  try {
    // Validate phone number
    if (!to) {
      throw new Error("Recipient phone number is required");
    }
    const phoneNumber = to.startsWith("+94") ? to : `+94${to}`;
    // Basic phone number validation (Twilio expects E.164 format)
    if (!/^\+\d{10,15}$/.test(phoneNumber)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }

    console.log(
      "sendSMS.js - Sending SMS to:",
      phoneNumber,
      "Message:",
      message
    );
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });
    console.log("sendSMS.js - Twilio Response:", {
      sid: result.sid,
      status: result.status,
      to: result.to,
      dateCreated: result.dateCreated,
    });
    return result;
  } catch (error) {
    console.error("sendSMS.js - Error sending SMS:", {
      message: error.message,
      code: error.code,
      status: error.status,
    });
    throw error;
  }
};

export default sendSMS;
