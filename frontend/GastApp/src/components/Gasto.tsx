import React from 'react'
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Gastos } from '../types';
import globalStyles from '../styles/index';


interface Gasto {
  gasto: Gastos;
}

const Gasto = ({gasto}: Gasto) => {

    // Para no tener que poner gasto.nombre/categoria etc
    const { nombre, categoria, cantidad, id} = gasto

  return (
    <View style={styles.contenedor}>
      <Text>{nombre}</Text>
      <Text>{cantidad}</Text>
      <Text>{categoria}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    contenedor:{
        ...globalStyles.contenedor,
        marginBottom: 20
    }
})

export default Gasto