const fetch = require('node-fetch');

exports.handler = async function (event) {
  const id = event.queryStringParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'ID parametresi gerekli.' }),
    };
  }

  const targetUrl = `https://macizlevip315.shop/wp-content/themes/ikisifirbirdokuz/match-center.php?id=${id}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://macizlevip315.shop/',
        'Origin': 'https://macizlevip315.shop',
        'Host': 'macizlevip315.shop',
      },
      timeout: 10000,
    });

    const html = await response.text();

    // script içeriğindeki potansiyel m3u8 linklerini veya fetch URL'lerini bul
    const scriptUrls = [];
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let scriptMatch;

    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
      const scriptContent = scriptMatch[1];

      // fetch(...) çağrılarını bul
      const fetchRegex = /fetch\s*\(\s*["']([^"']+)["']/gi;
      let fetchMatch;
      while ((fetchMatch = fetchRegex.exec(scriptContent)) !== null) {
        scriptUrls.push(fetchMatch[1]);
      }

      // player.load(...) veya source: ... içeren m3u8 linklerini bul
      const m3u8Regex = /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi;
      let m3u8Match;
      while ((m3u8Match = m3u8Regex.exec(scriptContent)) !== null) {
        scriptUrls.push(m3u8Match[1]);
      }
    }

    // En az bir .m3u8 içeriyorsa onu döndür
    const finalM3U8 = scriptUrls.find((u) => u.includes('.m3u8'));
    if (finalM3U8) {
      return {
        statusCode: 200,
        body: JSON.stringify({ url: finalM3U8, id }),
      };
    }

    // Eğer fetch ile başka endpoint çıkarsa onu analiz etmek gerek
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'M3U8 linki bulunamadı (script tarandı)',
        debugUrls: scriptUrls,
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'İşlem hatası', message: err.message }),
    };
  }
};
