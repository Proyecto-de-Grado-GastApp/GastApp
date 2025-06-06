const puppeteer = require('puppeteer');

async function getDaznData() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Accedemos a la página de planes de DAZN
  await page.goto('https://www.dazn.com/es-ES/account/content/DAZN/signup?page=TierPlans', { waitUntil: 'networkidle2' });

  // Extraemos los nombres y precios desde la estructura HTML
  const planes = await page.evaluate(() => {
    // Seleccionamos todos los bloques de planes que contengan nombre y precio
    const nombres = Array.from(document.querySelectorAll('.cardTitle___QxoOa.refinedCardTitle___1klqR, .cardTitle___QxoOa.refinedCardTitle___1klqR.refinedGoldenTitle___3aWIR'));
    const precios = Array.from(document.querySelectorAll('.cardPrice___2v46o.refinedCardPrice___bucvQ'));

    // Emparejamos por índice (asumiendo que hay igual cantidad de nombres y precios)
    return nombres.map((el, i) => {
      const nombre = el.textContent.trim();
      const precioTexto = precios[i]?.textContent.trim() || '';

      // Limpieza del precio
      const precio = precioTexto
        .replace(/€/g, '')
        .replace(/al mes/gi, '')
        .replace(/\/mes/gi, '')
        .replace(/[^\d,\.]+/g, '')
        .trim();

      return { nombre, precio };
    });
  });

  await browser.close();

  return {
    nombre: 'DAZN',
    planes: planes.map(p => ({
      nombre: p.nombre,
      precio: parseFloat(p.precio.replace(',', '.')) || 0,
    })),
  };
}

module.exports = { getDaznData };
