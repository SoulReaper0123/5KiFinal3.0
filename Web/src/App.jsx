import React from 'react';
import { AuthProvider } from '../../Web/src/web/WebAuth/AuthContext'; // Update the path
import WebNav from '../navigation/WebNav';

const App = () => {
  return (
    <AuthProvider>
      <WebNav />
    </AuthProvider>
  );
};

export default App;