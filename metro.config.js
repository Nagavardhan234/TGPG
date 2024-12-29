const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom configuration here
config.resolver.blockList = [
  /TGPGWEBSEVRICE\/.*/, // Block all files from the backend directory
];

module.exports = config; 