// Utilizo la librería puppeteer que automatiza el web scraping
const puppeteer = require('puppeteer');

async function getSpotifyData() {
  // Iniciamos el buscador y creamos una nueva página
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // Accedemos a la página web donde encontramos los planes
  await page.goto('https://www.spotify.com/es/premium/#plans', { waitUntil: 'networkidle2' });

    await page.waitForSelector('h3');

  // Obtenemos los distintos planes, seleccionando la clase HTML donde se encuentran y recorriendo el contenido cada vez que aparece la clase
   const plans = await page.evaluate(() => {
    // Seleccionamos solo los <h3> que tengan alguna de las clases que mencionaste (o cualquiera si no tienen clases)
    const elementos = Array.from(document.querySelectorAll('h3'));

    const resultado = [];

    elementos.forEach(h3 => {
      // Solo consideramos h3 con clases que coincidan con el patrón dado (Type__TypeElement-sc-goli3j-0 ddIxQM sc-2db2f7f1-1)
      if (
        h3.classList.contains('Type__TypeElement-sc-goli3j-0') &&
        h3.classList.contains('ddIxQM') &&
        h3.classList.contains('sc-2db2f7f1-1')
      ) {
        const nombre = h3.textContent.trim();

        // El precio normalmente está en el siguiente hermano
        let precio = 'No encontrado';
        const precioElem = h3.nextElementSibling;
        if (precioElem) {
          precio = precioElem.textContent.trim();
          const match = precio.match(/[\d,.]+/);
          precio = match ? match[0] : 'No encontrado';
        }

        resultado.push({ nombre, precio });
      }
    });

    return resultado;
  });
  // Cerramos el navegador
  await browser.close();
  // Devolvemos el objeto con el nombre y sus planes
  return {
    nombre: 'Spotify',
    planes: plans.map(p => ({
      nombre: p.nombre,
      precio: parseFloat(p.precio.replace(',', '.')) || 0,
    })),
  };
}

module.exports = { getSpotifyData };
