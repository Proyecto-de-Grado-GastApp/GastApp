// Utilizo la librería puppeteer que automatiza el web scraping
const puppeteer = require('puppeteer');

async function getNetflixData() {
  // Iniciamos el buscador y creamos una nueva página
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  // Accedemos a la página web donde encontramos los planes
  await page.goto('https://help.netflix.com/es-es/node/24926', { waitUntil: 'networkidle2' });
  // Obtenemos los distintos planes, seleccionando la clase HTML donde se encuentran en la página web
  const planes = await page.evaluate(() => {
    const elementos = Array.from(document.querySelectorAll('.doc-editor__marks__fontFamily'));
    // Sacamos el nombre del plan
    return elementos.map(el => {
      const nombrePlanCompleto = el.querySelector('.doc-editor__marks__bold');
      if (!nombrePlanCompleto) return null;
      // Sacamos el nombre del plan reemplazando el texto a partir de los dos puntos ':'
      const nombre = nombrePlanCompleto.textContent.trim().replace(/:$/, '');
      // Sacamos el nombre reemplazando el nombre del plan por '' y nos quedamos el resto
      const contenidoCompleto = el.textContent.trim();
      let precio = contenidoCompleto.replace(nombrePlanCompleto.textContent, '').trim();
      
      precio = precio
        .replace(/€/, '') // Eliminamos el símbolo del €
        .replace(/al mes/, '') // Eliminamos el texto 'al mes'
        .trim();
      // Devolvemos el nombre del plan y el precio
      return { nombre, precio };
    }).filter(Boolean);
  });
  // Cerramos el navegador
  await browser.close();
  // Devolvemos el objeto con el nombre y sus planes
  return {
    nombre: 'Netflix',
    planes: planes.map(p => ({
      nombre: p.nombre,
      precio: parseFloat(p.precio.replace(',', '.')) || 0,
    })),
  };
}

module.exports = { getNetflixData };
