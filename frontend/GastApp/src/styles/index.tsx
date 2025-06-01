import { StyleSheet } from 'react-native';

const globalStyles = StyleSheet.create({
  categoriaIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
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
});

export default globalStyles