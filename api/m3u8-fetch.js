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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
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

    // Daha gelişmiş m3u8 regex: url içinde m3u8 geçiyorsa yakala
    const regex = /https?:\/\/[^\s"']+\.m3u8[^\s"']*/gi;
    const matches = html.match(regex);

    if (!matches || matches.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'M3U8 linki bulunamadı' })
      };
    }

    // İlk linki al
    const m3u8Url = matches[0];

    return {
      statusCode: 200,
      body: JSON.stringify({ url: m3u8Url, id: id })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'İşlem hatası', message: error.message })
    };
  }
};
