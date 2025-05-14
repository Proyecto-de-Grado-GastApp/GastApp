import React from 'react';
import AppNavigator from '../src/navigation/AppNavigator';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

const App = () => {
  return (
    <SafeAreaView style={{ 
        flex: 1,
        backgroundColor: 'black',
      }}
      edges={['top', 'bottom']}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </SafeAreaView>
  );
};

export default App;