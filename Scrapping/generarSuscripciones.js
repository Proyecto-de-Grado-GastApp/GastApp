const fs = require('fs');
const path = require('path');
const { getSpotifyData } = require('./suscripciones/spotify');
const { getNetflixData } = require('./suscripciones/netflix');
const { getStravaData } = require('./suscripciones/strava');
const { getDaznData } = require('./suscripciones/dazn');
const { getPrimeVideoData } = require('./suscripciones/primevideo');
const { getDisneyPlusData } = require('./suscripciones/disney');


async function generarSuscripciones() {
  const spotify = await getSpotifyData();
  const netflix = await getNetflixData();
  const strava = await getStravaData();
  const dazn = await getDaznData();
  const primevideo = await getPrimeVideoData();
  const disney = await getDisneyPlusData();

  const suscripciones = [spotify, netflix, strava, dazn, primevideo, disney];
;

  const destino = path.resolve(__dirname, '../frontend/GastApp/src/data/suscripcionesData.ts');

  const contenido = `export const suscripciones = ${JSON.stringify(suscripciones, null, 2)};\n`;

  fs.writeFileSync(destino, contenido, 'utf8');
  console.log('Archivo suscripcionesData.ts generado en:', destino);
}

generarSuscripciones().catch((err) => {
  console.error('Error al generar el archivo:', err);
});
