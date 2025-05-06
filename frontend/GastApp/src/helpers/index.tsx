export const formatearCantidad = (cantidad: number) => {
    return cantidad.toLocaleString('es-ES',
        {
            style: 'currency',
            currency: 'EUR',
        }
    )
}