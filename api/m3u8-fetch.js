const puppeteer = require('puppeteer');

exports.handler = async function(event) {
  const id = event.queryStringParameters?.id;
  const url = `https://macizlevip315.shop/wp-content/themes/ikisifirbirdokuz/match-center.php?id=${id}`;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    await page.goto(url, { waitUntil: 'networkidle2' });

    const html = await page.content();
    await browser.close();

    const regex = /https?:\/\/[^\s"']+\.m3u8[^\s"']*/gi;
    const matches = html.match(regex);

    if (!matches || matches.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'M3U8 linki bulunamadı' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: matches[0] })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Tarayıcı hatası', message: e.message })
    };
  }
};
