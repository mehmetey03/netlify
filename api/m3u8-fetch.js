const chromium = require('chrome-aws-lambda');

exports.handler = async function(event) {
  const id = event.queryStringParameters?.id;
  if (!id || !/^\d+$/.test(id)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Geçersiz ID' }),
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

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    // Puppeteer sayfayı açıyor
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

    let m3u8Url = null;

    // Response event'lerinden .m3u8 URL'si yakalama
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('.m3u8') && !m3u8Url) {
        m3u8Url = url;
      }
    });

    // Birkaç saniye bekle (sayfa tam yüklensin)
    await page.waitForTimeout(3000);

    // Eğer event ile bulunmadıysa içerik içinde ara
    if (!m3u8Url) {
      const content = await page.content();
      const found = content.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/i);
      if (found) m3u8Url = found[0];
    }

    if (!m3u8Url) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'M3U8 bulunamadı' }),
      };
    }

    const proxiedUrl = `/.netlify/functions/proxy?url=${encodeURIComponent(m3u8Url)}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: proxiedUrl,
        originalUrl: m3u8Url,
        id,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'İşlem hatası', message: error.message }),
    };
  } finally {
    if (browser) await browser.close();
  }
};
