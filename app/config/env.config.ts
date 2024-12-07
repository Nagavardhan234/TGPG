const ENV = {
  development: {
    apiUrl: 'http://localhost:3000'
  },
  production: {
    apiUrl: 'https://your-production-api.com' // Update this with your production API URL
  },
  staging: {
    apiUrl: 'https://your-staging-api.com' // Update this with your staging API URL
  }
};

const getEnvVars = () => {
  // You can add logic here to determine the environment
  const env = process.env.NODE_ENV || 'development';
  return ENV[env] || ENV.development;
};

export default getEnvVars(); 