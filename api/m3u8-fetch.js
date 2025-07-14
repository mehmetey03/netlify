const puppeteer = require('puppeteer');

exports.handler = async function(event) {
  const id = event.queryStringParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'ID parametresi gerekli.' })
    };
  }

  const targetUrl = `https://macizlevip315.shop/wp-content/themes/ikisifirbirdokuz/match-center.php?id=${id}`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',  // modern headless
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115 Safari/537.36');

    // m3u8 linklerini XHR'dan yakalamak için dinleyici
    let m3u8Links = [];
    page.on('request', req => {
      const url = req.url();
      if (url.includes('.m3u8')) {
        m3u8Links.push(url);
      }
    });

    await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 20000
    });

    await page.waitForTimeout(5000); // biraz bekle, XHR'lar tam yüklensin

    await browser.close();

    if (m3u8Links.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ url: m3u8Links[0], id })
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'm3u8 linki puppeteer ile de bulunamadı.' })
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Puppeteer hatası', message: error.message })
    };
  }
};
