import React from 'react';
import { View, StyleSheet } from 'react-native';
import MainAppContent from '../components/MainAppContent';

const MainAppScreen = () => {
  return (
    <View style={styles.container}>
      <MainAppContent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});

export default MainAppScreen;