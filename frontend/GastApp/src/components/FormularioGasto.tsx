import React, {useState, useEffect} from 'react'
import { Text, SafeAreaView, View, TextInput, StyleSheet, Pressable } from 'react-native'
import { Picker } from "@react-native-picker/picker";

import globalStyles from '../../assets/styles/index';
import { Gastos } from '../types';
import { Categoria } from '../types';
import { initialGastoState } from '../types';




interface Recibido {
    setModal : (modal:boolean) => void;
    evaluarGasto: (gasto: Gastos) => void;
    modificarGasto: Gastos; // Objeto de tipo Gastos o vacío
    setModificarGasto: React.Dispatch<React.SetStateAction<Gastos>>;
}

const FormularioGasto = ({setModal, evaluarGasto, modificarGasto, setModificarGasto}:Recibido) => {

    // Nombre del gasto
    const [nombre, setNombre] = useState(initialGastoState.nombre);

    // Cantidad del gasto
    const [cantidad, setImporte] = useState(initialGastoState.cantidad);

    // Categoría del gasto
    const [categoria, setCategoria] = useState<Categoria | ''>(initialGastoState.categoria);

    //Id del gasto
    const [id, setId] = useState(initialGastoState.id);

    // Fecha del Gasto
    const [fecha, setFecha] = useState(initialGastoState.fecha)

    // Función para rellenar el formulario si estamos MODIFICANDO un gasto
    useEffect(() => {
        // Comprobamos que el gasto tiene valores introducidos o si es un gasto nuevo
        if ('nombre' in modificarGasto && modificarGasto.nombre) {
            
            setNombre(modificarGasto.nombre);
            setImporte(modificarGasto.cantidad);
            setCategoria(modificarGasto.categoria);
            setId(modificarGasto.id);
            setFecha(modificarGasto.fecha)
        }
    }, [modificarGasto]);


  return (
    <SafeAreaView style={styles.contenedor}>
        <Pressable 
            style={styles.closeBtn}
            onLongPress={() => {
                setModal(false)
                setModificarGasto(initialGastoState)
            }}
        >
            <Text style={styles.closeBtnText}>Cancelar</Text>
        </Pressable>

        <View style={styles.formulario}>
            <View>
                <Text style={styles.titulo}>
                    {'nombre' in modificarGasto && modificarGasto.nombre ? 'Modificar Gasto' : 'Nuevo Gasto'}
                </Text>
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
                    <Picker.Item label='Ocio' value="ocio"/>
                    <Picker.Item label='Salud' value="salud"/>
                    <Picker.Item label='Gastos Varios' value="gastos"/>
                </Picker>
            </View>

            <Pressable 
                style={styles.submitBtn}
                onPress={() => evaluarGasto({
                    nombre, cantidad, categoria : categoria as Categoria, id, fecha
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