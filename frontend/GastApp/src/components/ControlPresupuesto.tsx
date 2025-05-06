import React from 'react'
import { Text, View, Image, StyleSheet } from "react-native";

import globalStyles from '../styles/index';
import { formatearCantidad } from '../helpers' ;

interface Presupuesto {
    presupuesto:number
}

const ControlPresupuesto = ({presupuesto}:Presupuesto) => {
  return (
    <View style={styles.contenedor}>
        <View style={styles.centrarGrafica}>
            <Image 
                style={styles.imagen}
                source={ require('../img/grafico.jpg')}/>
        </View>

        <View>
            <Text>
                <Text>Presupuesto: </Text>
                {formatearCantidad(presupuesto)}
            </Text>

            <Text>
                <Text>Disponible: </Text>
                {formatearCantidad(presupuesto)}
            </Text>

            <Text>
                <Text>Gastado: </Text>
                {formatearCantidad(presupuesto)}
            </Text>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    contenedor:{
        ...globalStyles.contenedor
    },
    centrarGrafica:{
        alignItems: "center"
    },
    imagen:{
        width: 250,
        height: 250
    }
})

export default ControlPresupuesto