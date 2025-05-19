const fs = require('fs');
const path = require('path');
const { getSpotifyData } = require('./spotify');
const { getNetflixData } = require('./netflix');
const { getStravaData } = require('./strava');

async function generarSuscripciones() {
  const spotify = await getSpotifyData();
  const netflix = await getNetflixData();
  const strava = await getStravaData();

  const suscripciones = [spotify, netflix, strava];

  const destino = path.resolve(__dirname, '../frontend/GastApp/src/data/suscripcionesData.ts');

  const contenido = `export const suscripciones = ${JSON.stringify(suscripciones, null, 2)};\n`;

  fs.writeFileSync(destino, contenido, 'utf8');
  console.log('Archivo suscripcionesData.ts generado en:', destino);
}

generarSuscripciones().catch((err) => {
  console.error('Error al generar el archivo:', err);
});
