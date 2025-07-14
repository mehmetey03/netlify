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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://macizlevip315.shop/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
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

    // iframe varsa onu yakala
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/i;
    const iframeMatch = html.match(iframeRegex);

    let iframeHtml = '';
    if (iframeMatch && iframeMatch[1]) {
      const iframeUrl = iframeMatch[1].startsWith('http')
        ? iframeMatch[1]
        : `https://macizlevip315.shop/${iframeMatch[1]}`;

      const iframeResponse = await fetch(iframeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': targetUrl
        },
        timeout: 10000
      });

      iframeHtml = await iframeResponse.text();
    }

    // Ana sayfa + iframe içeriği birlikte aranacak
    const combinedHtml = html + '\n' + iframeHtml;

    // Geniş kapsamlı m3u8 regex
    const regex = /(["'])(https?:\/\/[^"']+\.m3u8[^"']*)\1/gi;
    let matches = [];
    let match;

    while ((match = regex.exec(combinedHtml)) !== null) {
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
