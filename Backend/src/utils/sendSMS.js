import twilio from 'twilio';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Debug current working directory
console.log('sendSMS.js - Current working directory:', process.cwd());

// Specify the path to .env file (in Backend directory)
const envPath = path.resolve(process.cwd(), '.env');
console.log('sendSMS.js - Looking for .env file at:', envPath);

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.error('sendSMS.js - Error: .env file not found at:', envPath);
  console.error('Please create a .env file in C:\\Users\\Zayan Mohamed\\Documents\\ProjectReact\\GoSync\\Backend with the following content:');
  console.error(`
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+12025550123
  `);
  throw new Error('.env file not found');
}

// // Attempt to read .env file contents for debugging
// try {
//   const envContent = fs.readFileSync(envPath, 'utf8');
//   console.log('sendSMS.js - .env file contents (raw):', envContent);
// } catch (error) {
//   console.error('sendSMS.js - Error reading .env file:', error.message);
//   throw new Error('Failed to read .env file');
// }

dotenv.config({ path: envPath });

// Debug loaded environment variables
console.log('sendSMS.js - Loaded environment variables:', {
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? '****' : undefined,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? '****' : undefined,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || undefined,
});

// Validate Twilio configuration
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    'sendSMS.js - Missing required Twilio environment variables:',
    missingEnvVars.join(', ')
  );
  throw new Error('Twilio configuration is incomplete');
}

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async (to, message) => {
  try {
    // Validate phone number
    if (!to) {
      throw new Error('Recipient phone number is required');
    }
    const phoneNumber = to.startsWith('+94') ? to : `+94${to}`;
    // Basic phone number validation (Twilio expects E.164 format)
    if (!/^\+\d{10,15}$/.test(phoneNumber)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }

    console.log('sendSMS.js - Sending SMS to:', phoneNumber, 'Message:', message);
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    console.log('sendSMS.js - Twilio Response:', {
      sid: result.sid,
      status: result.status,
      to: result.to,
      dateCreated: result.dateCreated,
    });
    return result;
  } catch (error) {
    console.error('sendSMS.js - Error sending SMS:', {
      message: error.message,
      code: error.code,
      status: error.status,
    });
    throw error;
  }
};

export default sendSMS;