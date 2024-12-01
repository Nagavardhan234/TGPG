const DEV_API_URL = 'http://localhost:3000'; // Replace with your computer's IP address
const PROD_API_URL = 'https://your-production-api.com';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL; 