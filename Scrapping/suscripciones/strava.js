// Utilizo la librería puppeteer que automatiza el web scraping
const puppeteer = require('puppeteer');

async function getStravaData() {
  // Iniciamos el buscador y creamos una nueva página
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  // Accedemos a la página web donde encontramos los planes
  await page.goto('https://www.strava.com/subscribe?origin=website_header#plan-card-section', {
    waitUntil: 'networkidle2'
  });

  await page.waitForSelector('.PlanCard_title__vBiLz');
  await page.waitForSelector('.plan-price');

  // Obtenemos los distintos planes, seleccionando la clase HTML donde se encuentran en la página web
  const planes = await page.evaluate(() => {
    const titulos = document.querySelectorAll('.PlanCard_title__vBiLz');
    const precios = document.querySelectorAll('.plan-price');

    let resultado = [];
    // Con el título de plan buscamos el precio
    for (let i = 0; i < titulos.length; i++) {
      const nombre = titulos[i]?.textContent.trim();

      const contenedorPrecio = precios[i];
      let precio = 'No encontrado';
      let textoPrecio = '';
      // Cogemos el precio filtrando por la clase HTML que los contiene en la página web
      if (contenedorPrecio) {
        const precioPlan = contenedorPrecio.querySelector('.plan-price');
        if (precioPlan) {
          textoPrecio = precioPlan.textContent.trim();
        } else {
          textoPrecio = contenedorPrecio.innerText.trim();
        }

        // Reemplazamos 
        precio = textoPrecio
          .replace(/\n+/g, ' ') // Elimina los santos de línea
          .replace(/\s*por persona\*?/, '') // Elimina el "por persona" que aparece en la página web
          .replace(/[^\d,\.]+/g, '') // Emilina cualquier otro tipo de texto que pueda aparecer
          .trim();
      }
      // Guardamos los resultados en el array
      resultado.push({ nombre, precio });
    }

    return resultado;
  });
  // Cerramos el navegador
  await browser.close();
  // Devolvemos el objeto con el nombre y sus planes
  return {
    nombre: 'Strava',
    planes: planes.map(p => ({
      nombre: p.nombre,
      precio: parseFloat(p.precio.replace(',', '.')) || 0,
    })),
  };
}

module.exports = { getStravaData };
