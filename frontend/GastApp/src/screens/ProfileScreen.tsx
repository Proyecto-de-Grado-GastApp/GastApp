import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const ProfileScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      {/* Header con foto */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>Usuario Ejemplo</Text>
        <Text style={styles.email}>usuario@ejemplo.com</Text>
      </View>

      {/* Opciones de perfil */}
      <View style={styles.optionsContainer}>
        {[
          { icon: 'person', text: 'Editar Perfil' },
          { icon: 'settings', text: 'Configuración' },
          { icon: 'log-out', text: 'Cerrar Sesión' },
        ].map((item, index) => (
          <TouchableOpacity key={index} style={styles.option}>
            <Icon name={item.icon} size={24} color="#666" />
            <Text style={styles.optionText}>{item.text}</Text>
            <Icon name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#2563eb',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    color: '#666',
    fontSize: 16,
  },
  optionsContainer: {
    paddingHorizontal: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 10,
    marginBottom: 10,
  },
  optionText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
  },
});

export default ProfileScreen;