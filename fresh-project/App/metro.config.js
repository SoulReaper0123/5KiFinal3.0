const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable hot reloading and fast refresh
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Clear cache more aggressively
config.resetCache = true;

// Enable fast refresh
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;