import React from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";

import globalStyles from '../styles/index';

/* Creo la interfaz para establecer el tipo de dato de la función que valida el valor introducido en el presupuesto
 y recibir el estado del presupuseto de App para poder mandarlo también a la ventana de contro de presupuesto*/
interface NuevoPresupuesto {
    presupuesto: number;
    setpresupuesto: (presupuesto: number) => void;
    handleNuevoPresupuesto: (presupuesto: number) => void;
  }

const NuevoPresupuesto = ({
    presupuesto,
    setpresupuesto,
    handleNuevoPresupuesto,
}: NuevoPresupuesto) => {

    // useState para capturar el valor introducido en el presupuesto
   

  return (
    <View style={styles.contenedor}>
        <Text style={styles.label}>Definir Presupuesto</Text>

        <TextInput
            keyboardType='numeric'
            style={styles.input}
            value={presupuesto.toString()} // No modifica a String, solo lo muestra
            /* onChangeText devuelve un string pero nuestra variable presupuesto es de tipo number, por eso debemos pasar el texto a number para que
            setpresupuesto lo acepte
            */
            onChangeText={(text) => setpresupuesto(Number(text))} 

        />

        <Pressable 
            style={styles.boton}
            onPress={() => handleNuevoPresupuesto(presupuesto)}    
        >
            <Text style={styles.botonText}>Agregar Presupuesto</Text>
        </Pressable>

    </View>
  )
}

const styles = StyleSheet.create({
    contenedor:{
        ...globalStyles.contenedor
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