const fetch = require('node-fetch');

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
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://macizlevip315.shop/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Sayfa yüklenemedi: HTTP ${response.status}` })
      };
    }

    const html = await response.text();

    // console.log(html); // Gerekirse aktif et

    const regex = /(["'])(https?:\/\/[^"']+\.m3u8[^"']*)\1/gi;
    let matches = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      matches.push(match[2]);
    }

    if (matches.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'M3U8 linki bulunamadı' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: matches[0], id: id })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'İşlem hatası', message: error.message })
    };
  }
};
