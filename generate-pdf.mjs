import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
const filePath = path.resolve(__dirname, 'hirenexa-project-report.html');
await page.goto('file:///' + filePath.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 30000 });
await page.emulateMediaType('print');

const desktop = os.homedir() + '\\OneDrive\\Desktop\\HireNexa-Project-Report.pdf';
await page.pdf({
  path: desktop,
  format: 'A4',
  printBackground: true,
  margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
});
await browser.close();
console.log('PDF saved to: ' + desktop);
