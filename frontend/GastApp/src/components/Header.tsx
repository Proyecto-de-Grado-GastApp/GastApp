import React from 'react'
import { Text, View, StyleSheet, StatusBar } from "react-native";

const Header = () => {
  return (
    <View style={styles.header}>
      <StatusBar backgroundColor={"#3b82f6"} barStyle='dark-content' />
      <Text style={styles.titulo}>GastApp</Text>

    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#3b82f6",
  },

  titulo: {
    textAlign: 'center',
    fontSize: 30,
    color: "white",
    textTransform: 'uppercase',
    fontWeight: 'bold',
    paddingVertical: 10

  }
})

export default Header;