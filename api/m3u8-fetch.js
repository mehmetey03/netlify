const chromium = require('chrome-aws-lambda');

exports.handler = async (event) => {
  const id = event.queryStringParameters?.id;
  if (!id || !/^\d+$/.test(id)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Geçersiz veya eksik ID parametresi' }),
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

    let m3u8Url = null;

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('.m3u8') && !m3u8Url) {
        m3u8Url = url;
      }
    });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Ek bekleme (isteğe bağlı)
    await page.waitForTimeout(3000);

    // Eğer m3u8 url bulunamadıysa sayfa içeriğinden manuel arama
    if (!m3u8Url) {
      const content = await page.content();
      const urlMatch = content.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/i);
      if (urlMatch) m3u8Url = urlMatch[1];
    }

    if (!m3u8Url) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'M3U8 bulunamadı' }),
      };
    }

    // Cevap olarak bulduğumuz URL'yi döndür
    return {
      statusCode: 200,
      body: JSON.stringify({
        id,
        url: m3u8Url,
      }),
    };

  } catch (error) {
    console.error('Hata:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'İşlem hatası', message: error.message }),
    };
  } finally {
    if (browser) await browser.close();
  }
};
