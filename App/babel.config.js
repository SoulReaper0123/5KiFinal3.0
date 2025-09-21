module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    ['module:react-native-dotenv'],
    // Reanimated plugin must be last
    'react-native-reanimated/plugin',
  ],
};