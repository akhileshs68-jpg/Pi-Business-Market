import * as dotenv from 'dotenv';
dotenv.config();

if (process.env.PI_NETWORK_API_KEY) {
  console.log('PI_NETWORK_API_KEY: PRESENT');
} else {
  console.log('PI_NETWORK_API_KEY: MISSING');
}
