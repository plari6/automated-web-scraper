const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function runScraper() {
  console.log('🚀 Launching stealth browser scraper...');

  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set realistic browser footprint
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  // Example Scrape Target: Books to Scrape (Standard Sandbox Site)
  console.log('🌐 Navigating to target site...');
  await page.goto('https://books.toscrape.com/', { waitUntil: 'domcontentloaded' });

  console.log('🔍 Extracting structured product data...');
  const products = await page.evaluate(() => {
    const items = [];
    const cardElements = document.querySelectorAll('.product_pod');

    cardElements.forEach(card => {
      const title = card.querySelector('h3 a')?.getAttribute('title') || 'N/A';
      const price = card.querySelector('.price_color')?.innerText || 'N/A';
      const availability = card.querySelector('.availability')?.innerText.trim() || 'N/A';
      const link = card.querySelector('h3 a')?.getAttribute('href') || 'N/A';

      items.push({ title, price, availability, link });
    });

    return items;
  });

  console.log(`✅ Successfully extracted ${products.length} records.`);

  // Export to CSV
  const csvPath = path.join(outputDir, 'scraped_products.csv');
  const csvWriter = createCsvWriter({
    path: csvPath,
    header: [
      { id: 'title', title: 'TITLE' },
      { id: 'price', title: 'PRICE' },
      { id: 'availability', title: 'AVAILABILITY' },
      { id: 'link', title: 'URL' }
    ]
  });

  await csvWriter.writeRecords(products);
  console.log(`📊 Data saved to CSV: ${csvPath}`);

  await browser.close();
}

runScraper().catch(err => console.error('❌ Scraper error:', err));
