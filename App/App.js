import 'react-native-gesture-handler'; // must be first for React Navigation
import 'react-native-reanimated'; // required for Reanimated-powered navigators
import React from 'react';
import { Platform } from 'react-native';

// Dynamically require navigation to avoid bundling web-only libs on native
const App = () => {
  if (Platform.OS === 'web') {
    const WebNav = require('./navigation/WebNav').default;
    return <WebNav />;
  }
  const AppNav = require('./navigation/AppNav').default;
  return <AppNav />;
};

export default App;

