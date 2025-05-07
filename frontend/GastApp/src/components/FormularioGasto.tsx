import React, {useState} from 'react'
import { Text, SafeAreaView, View, TextInput, StyleSheet, Pressable } from 'react-native'
import { Picker } from "@react-native-picker/picker";

import globalStyles from '../styles/index';
import { Gastos } from '../types';


interface Recibido {
    setModal : (modal:boolean) => void;
    evaluarGasto: (gasto: Gastos) => void;
}

const FormularioGasto = ({setModal, evaluarGasto}:Recibido) => {

    // Nombre del gasto
    const [nombre, setNombre] = useState('');

    // Cantidad del gasto
    const [cantidad, setImporte] = useState(0);

    // Categoría del gasto
    const [categoria, setCategoria] = useState('');

  return (
    <SafeAreaView style={styles.contenedor}>
        <Pressable 
            style={styles.closeBtn}
            onLongPress={() => setModal(false)}
        >
            <Text style={styles.closeBtnText}>Cancelar</Text>
        </Pressable>

        <View style={styles.formulario}>
            <View>
                <Text style={styles.titulo}>Nuevo Gasto</Text>
            </View>

            <View style={styles.campo}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                    style={styles.input}
                    placeholder='Nombre del gasto. Ej: Comida'
                    value={nombre}
                    onChangeText={setNombre}
                />
            </View>

            <View style={styles.campo}>
                <Text style={styles.label}>Importe</Text>
                <TextInput
                    style={styles.input}
                    placeholder='Importe del gasto. Ej: 30'
                    keyboardType='numeric'
                    value={cantidad.toString()}
                    onChangeText={(text) => setImporte(Number(text))}
                />
            </View>

            <View style={styles.campo}>
                <Text style={styles.label}>Categoría</Text>
                <Picker selectedValue={categoria} onValueChange={(itemValue) => setCategoria(itemValue)}>
                    <Picker.Item label='-- Seleccione --' value=""/>
                    <Picker.Item label='Comida' value="comida"/>
                    <Picker.Item label='Ahorro' value="ahorro"/>
                    <Picker.Item label='Suscripciones' value="suscripciones"/>
                    <Picker.Item label='Ocio' value="Ocio"/>
                    <Picker.Item label='Salud' value="Salud"/>
                </Picker>
            </View>

            <Pressable 
                style={styles.submitBtn}
                onPress={() => evaluarGasto({
                    nombre, cantidad, categoria
                })}
            >
                <Text style={styles.submitBtnText}>Guardar</Text>
            </Pressable>

        </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    contenedor: {
        backgroundColor: "#1e40af",
        flex: 1
    },
    closeBtn:{
        backgroundColor: "#db2777",
        padding: 10,
        marginTop: 30,
        marginHorizontal: 10,
    },
    closeBtnText:{
        textTransform: 'uppercase',
        color: "white",
        fontWeight: 'bold',
        textAlign: 'center'
    },
    formulario:{
        ...globalStyles.contenedor
    },
    titulo:{
        textAlign: 'center',
        fontSize: 28,
        marginBottom: 30,
        color: "#64748b"
    },
    campo:{
        marginVertical: 10
    },
    label:{
        color: "#64748b",
        textTransform: 'uppercase',
        fontSize: 16,
        fontWeight: 'bold'
    },
    input:{
        backgroundColor: "#F5F5F5",
        padding: 10,
        borderRadius: 10,
        marginTop: 10
    },
    submitBtn: {
        backgroundColor: "#3b82f6",
        padding: 10,
        marginTop: 20,
        borderRadius: 10
    },
    submitBtnText:{
        textAlign: 'center',
        color: "white",
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    

})

export default FormularioGasto