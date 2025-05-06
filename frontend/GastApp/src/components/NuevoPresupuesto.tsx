import React, {useState} from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";

import globalStyles from '../styles/index';

// Creo la interfaz para establecer el tipo de dato de la función que valida el valor introducido en el presupuesto
interface NuevoPresupuesto {
    handleNuevoPresupuesto: (presupuesto: number) => void;
  }

const NuevoPresupuesto = ({handleNuevoPresupuesto}: NuevoPresupuesto) => {

    // useState para capturar el valor introducido en el presupuesto
    const [presupuesto, setpresupuesto] = useState(0)

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