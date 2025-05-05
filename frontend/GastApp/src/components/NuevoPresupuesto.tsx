import React from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";

const NuevoPresupuesto = () => {
  return (
    <View style={styles.contenedor}>
        <Text style={styles.label}>Definir Presupuesto</Text>

        <TextInput
            keyboardType='numeric'
            placeholder='Introduce tu presupuesto: Ej. 300'
            style={styles.input}
        />

        <Pressable style={styles.boton}>
            <Text style={styles.botonText}>Agregar Presupuesto</Text>
        </Pressable>

    </View>
  )
}

const styles = StyleSheet.create({
    contenedor:{
        backgroundColor: "white",
        marginHorizontal: 10,
        borderRadius: 10,
        padding: 20,
        transform: [{translateY: 40}],
        shadowColor: "black",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,
    },
    label:{
        textAlign: 'center',
        fontSize: 24,
        color: "#3b82f6",
        marginBottom: 20,
    },
    input: {
        backgroundColor: "#F5F5F5",
        padding: 10,
        borderRadius: 10,
        textAlign: 'center',
    },
    boton:{
        marginTop: 30,
        backgroundColor: "#1048A4",
        padding: 10,
        borderRadius: 10
    },
    botonText:{
        color: "white",
        textAlign: 'center',
        textTransform: 'uppercase',
        fontWeight: 'bold'
    }
})

export default NuevoPresupuesto