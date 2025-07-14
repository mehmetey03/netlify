const fetch = require('node-fetch');
const cheerio = require('cheerio');

exports.handler = async (event) => {
  try {
    const { id } = event.queryStringParameters || {};
    if (!id || !/^\d+$/.test(id)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Geçersiz ID', message: 'örn: ?id=5062' }),
      };
    }

    const targetUrl = `https://macizlevip315.shop/wp-content/themes/ikisifirbirdokuz/match-center.php?id=${id}`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://macizlevip315.shop/',
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    const links = new Set();

    // Tüm sayfadaki m3u8 linklerini ara
    const globalMatches = html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi);
    if (globalMatches) globalMatches.forEach(link => links.add(link));

    // iframe, video, source, a etiketlerinden m3u8 linkleri
    $('iframe[src], video[src], source[src], a[href]').each((_, el) => {
      const url = $(el).attr('src') || $(el).attr('href');
      if (url?.includes('.m3u8')) links.add(url);
    });

    // data-url veya data-src attribute'larında m3u8 linkleri
    $('[data-url], [data-src]').each((_, el) => {
      const url = $(el).attr('data-url') || $(el).attr('data-src');
      if (url?.includes('.m3u8')) links.add(url);
    });

    if (links.size === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'M3U8 bulunamadı', id }),
      };
    }

    // İlk bulduğunu dön
    const found = [...links][0];
    return {
      statusCode: 200,
      body: JSON.stringify({
        id,
        originalUrl: found,
        url: `/.netlify/functions/proxy?url=${encodeURIComponent(found)}`,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Sunucu hatası', message: err.message }),
    };
  }
};
