const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const id = event.queryStringParameters?.id;
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'ID parametresi yok' }) };
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const targetUrl = `https://macizlevip315.shop/wp-content/themes/ikisifirbirdokuz/match-center.php?id=${id}`;
    let m3u8Url = null;

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('.m3u8') && !m3u8Url) {
        m3u8Url = url;
      }
    });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Ekstra bekle, bazen geç yükleniyor
    await page.waitForTimeout(3000);

    if (!m3u8Url) {
      const content = await page.content();
      const match = content.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/i);
      m3u8Url = match ? match[1] : null;
    }

    if (!m3u8Url) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'M3U8 bulunamadı' }),
      };
    }

    // Proxy URL oluştur
    const proxiedUrl = `${event.headers['x-forwarded-proto'] || 'https'}://${event.headers.host}/.netlify/functions/proxy?url=${encodeURIComponent(m3u8Url)}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: proxiedUrl,
        originalUrl: m3u8Url,
        id: id,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'İşlem hatası', message: error.message }),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
