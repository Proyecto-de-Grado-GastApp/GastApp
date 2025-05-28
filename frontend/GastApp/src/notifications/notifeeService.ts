import notifee, { AndroidImportance } from '@notifee/react-native';

export async function mostrarNotificacionNuevoGasto(descripcion: string, cantidad: number) {
  // Cleamos el canal
  const channelId = await notifee.createChannel({
    id: 'gastapp-channel',
    name: 'Gastos',
    importance: AndroidImportance.HIGH,
  });

  // Mostramos la notificación
  await notifee.displayNotification({
    title: 'Nuevo gasto registrado',
    body: `${descripcion.trim()} - ${cantidad.toFixed(2)} €`,
    android: {
      channelId,
      smallIcon: 'ic_gastapp',
      largeIcon: 'ic_gastapp',
      pressAction: {
        id: 'default',
      },
    },
  });
}

export async function mostrarNotificacionNuevaSuscripcion(descripcion: string, cantidad: number) {
  // Creamos el canal
  const channelId = await notifee.createChannel({
    id: 'gastapp-channel',
    name: 'Gastos',
    importance: AndroidImportance.HIGH,
  });

  // Mostramos la notificación
  await notifee.displayNotification({
    title: 'Nueva suscripción registrada',
    body: `${descripcion.trim()} - ${cantidad.toFixed(2)} €`,
    android: {
      channelId,
      smallIcon: 'ic_gastapp',
      largeIcon: 'ic_gastapp',
      pressAction: {
        id: 'default',
      },
    },
  });
}

export async function mostrarNotificacionPresupuestoCasiAgotado(categoria: string, presupuesto: number, restante: number) {
  const channelId = await notifee.createChannel({
    id: 'gastapp-channel',
    name: 'Gastos',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: `¡Cuidado! Presupuesto casi agotado en ${categoria}`,
    body: `Presupuesto: ${presupuesto.toFixed(2)}€. Quedan solo ${restante.toFixed(2)}€ disponibles. Evita gastar más.`,
    android: {
      channelId,
      smallIcon: 'ic_gastapp',
      largeIcon: 'ic_gastapp',
      pressAction: { id: 'default' },
    },
  });
}

export async function mostrarNotificacionPresupuestoSuperado(categoria: string, presupuesto: number, excedido: number) {
  const channelId = await notifee.createChannel({
    id: 'gastapp-channel',
    name: 'Gastos',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: `¡Presupuesto superado en ${categoria}!`,
    body: `Presupuesto: ${presupuesto.toFixed(2)}€. Has excedido en ${excedido.toFixed(2)}€. Revisa tus gastos.`,
    android: {
      channelId,
      smallIcon: 'ic_gastapp',
      largeIcon: 'ic_gastapp',
      pressAction: { id: 'default' },
    },
  });
}

