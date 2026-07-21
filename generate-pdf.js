const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const filePath = path.resolve(__dirname, 'hirenexa-project-report.html');
  await page.goto('file:///' + filePath.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 30000 });
  await page.emulateMediaType('print');
  const desktop = require('os').homedir() + '\\OneDrive\\Desktop\\HireNexa-Project-Report.pdf';
  await page.pdf({
    path: desktop,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });
  await browser.close();
  console.log('PDF saved to: ' + desktop);
})();
