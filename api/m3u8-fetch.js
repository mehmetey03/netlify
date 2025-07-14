const chromium = require('chrome-aws-lambda');
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const id = event.queryStringParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'ID parametresi eksik' }),
    };
  }

  const targetUrl = `https://macizlevip315.shop/wp-content/themes/ikisifirbirdokuz/match-center.php?id=${id}`;
  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    let m3u8Url = null;

    // m3u8 içeren istekleri yakala
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('.m3u8') && !m3u8Url) {
        m3u8Url = url;
      }
    });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Bekle biraz, bazen JS sonrası değişiyor
    await page.waitForTimeout(3000);

    if (!m3u8Url) {
      const content = await page.content();
      const regex = /(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/i;
      const match = content.match(regex);
      if (match) m3u8Url = match[1];
    }

    if (!m3u8Url) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'M3U8 bulunamadı' }),
      };
    }

    // M3U8 linkini proxylemek için kendi endpoint'imize yönlendir
    const proxiedUrl = `${event.headers['x-forwarded-proto'] || 'https'}://${event.headers.host}/.netlify/functions/proxy?url=${encodeURIComponent(m3u8Url)}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ url: proxiedUrl, originalUrl: m3u8Url, id }),
    };
  } catch (error) {
    console.error('Hata:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'İşlem hatası', message: error.message }),
    };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};
