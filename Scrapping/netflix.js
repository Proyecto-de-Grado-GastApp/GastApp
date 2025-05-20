const puppeteer = require('puppeteer');

async function getNetflixData() {
  const url = 'https://help.netflix.com/es-es/node/24926';

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle2' });

  const planes = await page.evaluate(() => {
    const elementos = Array.from(document.querySelectorAll('.doc-editor__marks__fontFamily'));

    return elementos.map(el => {
      const nombreSpan = el.querySelector('.doc-editor__marks__bold');
      if (!nombreSpan) return null;

      const nombre = nombreSpan.textContent.trim().replace(/:$/, '');

      const contenidoCompleto = el.textContent.trim();
      let precio = contenidoCompleto.replace(nombreSpan.textContent, '').trim();

      precio = precio
        .replace(/€/, '')
        .replace(/al mes/, '')
        .trim();

      return { nombre, precio };
    }).filter(Boolean);
  });

  await browser.close();

  return {
    nombre: 'Netflix',
    planes: planes.map(p => ({
      nombre: p.nombre,
      precio: parseFloat(p.precio.replace(',', '.')) || 0,
    })),
  };
}

module.exports = { getNetflixData };
