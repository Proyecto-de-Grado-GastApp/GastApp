const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.spotify.com/es/premium/#plans', { waitUntil: 'networkidle2' });

  const plans = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('h3[data-encore-id="type"]').forEach(h3 => {
      const nombre = h3.textContent.trim();
      let precio = 'No encontrado';

      const precioElem = h3.nextElementSibling;
      if (precioElem && precioElem.classList.contains('sc-71cce616-5')) {
        precio = precioElem.textContent.trim();
      }

      results.push({ nombre, precio });
    });
    return results;
  });

  const planesFiltrados = plans.filter(plan =>
  ['Individual', 'Estudiantes', 'Duo', 'Familiar'].includes(plan.nombre)
);

console.log('Planes Premium filtrados:', planesFiltrados);


  await browser.close();
})();
