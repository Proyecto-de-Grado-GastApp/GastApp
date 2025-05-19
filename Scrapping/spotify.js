const puppeteer = require('puppeteer');

async function getSpotifyData() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.spotify.com/es/premium/#plans', { waitUntil: 'networkidle2' });

  const plans = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('h3.sc-71cce616-1').forEach(h3 => {
      const nombre = h3.textContent.trim();
      let precio = 'No encontrado';

      const precioElem = h3.nextElementSibling;
      if (precioElem && precioElem.classList.contains('sc-71cce616-5')) {
        precio = precioElem.textContent.trim();
        const match = precio.match(/[\d,.]+/);
        precio = match ? match[0] : 'No encontrado';
      }

      results.push({ nombre, precio });
    });
    return results;
  });

  await browser.close();

  return {
    nombre: 'Spotify',
    planes: plans.map(p => ({
      nombre: p.nombre,
      precio: parseFloat(p.precio.replace(',', '.')) || 0,
    })),
  };
}

module.exports = { getSpotifyData };
