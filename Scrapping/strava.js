const puppeteer = require('puppeteer');

async function getStravaData() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://www.strava.com/subscribe?origin=website_header#plan-card-section', {
    waitUntil: 'networkidle2'
  });

  const planes = await page.evaluate(() => {
    const titulos = document.querySelectorAll('.PlanCardV2_title__0rUUI');
    const precios = document.querySelectorAll('.PlanCardV2_price__sWtnv');

    let resultado = [];

    for (let i = 0; i < titulos.length; i++) {
      const nombre = titulos[i]?.textContent.trim();

      const contenedorPrecio = precios[i];
      let precio = 'No encontrado';
      let textoPrecio = '';

      if (contenedorPrecio) {
        const planPriceEl = contenedorPrecio.querySelector('.plan-price');
        if (planPriceEl) {
          textoPrecio = planPriceEl.textContent.trim();
        } else {
          textoPrecio = contenedorPrecio.innerText.trim();
        }

        precio = textoPrecio
          .replace(/\n+/g, ' ')
          .replace(/\s*por persona\*?/, '')
          .replace(/[^\d,\.]+/g, '')
          .trim();
      }

      resultado.push({ nombre, precio });
    }

    return resultado;
  });

  await browser.close();

  return {
    nombre: 'Strava',
    planes: planes.map(p => ({
      nombre: p.nombre,
      precio: parseFloat(p.precio.replace(',', '.')) || 0,
    })),
  };
}

module.exports = { getStravaData };
