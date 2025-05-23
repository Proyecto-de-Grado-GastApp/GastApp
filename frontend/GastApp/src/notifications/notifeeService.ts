import notifee, { AndroidImportance } from '@notifee/react-native';

export async function mostrarNotificacionGasto(descripcion: string, cantidad: number) {
  // Asegúrate de que el canal exista
  const channelId = await notifee.createChannel({
    id: 'gastapp-channel',
    name: 'Gastos',
    importance: AndroidImportance.HIGH,
  });

  // Mostrar la notificación
  await notifee.displayNotification({
    title: 'Nuevo gasto registrado',
    body: `${descripcion.trim()} - ${cantidad.toFixed(2)} €`,
    android: {
      channelId,
      smallIcon: 'ic_launcher', // Asegúrate de tener un ícono llamado así
      pressAction: {
        id: 'default',
      },
    },
  });
}
