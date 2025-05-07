import React from 'react'
import { Text, View, StyleSheet } from "react-native";
import { Gastos } from '../types';
import Gasto from "./Gasto";

interface GastosGuardados {
    gastos :Gastos[]
}


const ListadoGastos = ({gastos}: GastosGuardados) => {
  return (
    <View style={styles.contenedor}>
        <Text style={styles.titulo}>Gastos</Text>

        {gastos.length === 0 ? 
        <Text style={styles.noGastos}>No hay gastos guardados</Text> : 
        // Si hay gastos guardados recorremos los gastos
        gastos.map(gasto => (<Gasto key={gasto.id || gasto.nombre} gasto={gasto} />))
}
    </View>
  )
}

const styles = StyleSheet.create({
    contenedor: {
        marginTop: 70,
        marginBottom: 100
    },
    titulo:{
        color: "#64748b",
        fontSize: 30,
        textAlign: 'center',
        fontWeight: '700',
        marginTop: 10
    },
    noGastos:{
        marginTop: 20,
        textAlign: 'center',
        fontSize: 20
    }
})

export default ListadoGastos