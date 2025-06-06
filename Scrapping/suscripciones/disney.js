const puppeteer = require('puppeteer');

async function getDisneyPlusData() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://www.disneyplus.com/es-es', { waitUntil: 'networkidle2' });

  await page.waitForSelector('span.k6iab93');

  const planes = await page.evaluate(() => {
    const resultados = [];

    document.querySelectorAll('span.k6iab93').forEach(span => {
      const texto = span.textContent.trim();

      // Solo procesar spans que contienen /mes (indicando un plan con precio mensual)
      if (!texto.includes('/mes')) return;

      // Extraer nombre del plan (ej. "Prémium", "Estándar con anuncios")
      const nombreMatch = texto.match(/^([A-Za-z\s]+?)\s*\(/);
      const nombre = nombreMatch ? nombreMatch[1].trim().toUpperCase() : 'DESCONOCIDO';

      // Extraer precio mensual
      const precioMatch = texto.match(/([\d,]+)\s*€\/mes/);
      const precio = precioMatch ? parseFloat(precioMatch[1].replace(',', '.')) : 0;

      resultados.push({ nombre, precio });
    });

    return resultados;
  });

  await browser.close();

  return {
    nombre: 'Disney+',
    planes
  };
}

module.exports = { getDisneyPlusData };
