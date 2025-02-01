module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': '.',
            '@app': './app',
            '@components': './app/components',
            '@config': './app/config',
            '@services': './app/services'
          }
        }
      ],
      'react-native-reanimated/plugin',
    ]
  };
}; 