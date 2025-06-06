const puppeteer = require('puppeteer');

async function getPrimeVideoData() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    'https://www.primevideo.com/-/es/offers/nonprimehomepage/ref=dv_web_force_root?language=es',
    { waitUntil: 'domcontentloaded' }
  );

  // Esperamos un texto que contenga "€/año" o "€/mes"
  await page.waitForFunction(() => {
    return [...document.querySelectorAll('span, p, div')]
      .some(el => el.textContent.match(/€.*\/año|€.*\/mes/i));
  });

  const planes = await page.evaluate(() => {
    // Buscar cualquier texto relevante
    const posibles = [...document.querySelectorAll('span, p, div')];
    const resultados = [];

    for (const el of posibles) {
      const texto = el.textContent;

      if (!texto) continue;

      const anualMatch = texto.match(/€\s?([\d,.]+)\s*\/\s*año/i);
      if (anualMatch) {
        resultados.push({
          nombre: 'Anual',
          precio: parseFloat(anualMatch[1].replace(',', '.'))
        });
      }

      const mensualMatch = texto.match(/€\s?([\d,.]+)\s*\/\s*mes/i);
      if (mensualMatch) {
        resultados.push({
          nombre: 'Mensual',
          precio: parseFloat(mensualMatch[1].replace(',', '.'))
        });
      }

      if (resultados.length > 0) break; // Terminamos si ya los tenemos
    }

    return resultados;
  });

  await browser.close();

  return {
    nombre: 'Prime Video',
    planes
  };
}

module.exports = { getPrimeVideoData };
