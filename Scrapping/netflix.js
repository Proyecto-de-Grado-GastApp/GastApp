const puppeteer = require('puppeteer');

(async () => {
  const url = 'https://help.netflix.com/es-es/node/24926'; // Cambia por la URL que quieras

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
      const precio = contenidoCompleto.replace(nombreSpan.textContent, '').trim();

      return { nombre, precio };
    }).filter(Boolean);
  });

  console.log('Planes encontrados:', planes);

  await browser.close();
})();
