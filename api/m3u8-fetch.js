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
    // Ana sayfayı çek
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://macizlevip315.shop/',
        'Origin': 'https://macizlevip315.shop',
        'Host': 'macizlevip315.shop',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow',
      timeout: 10000
    });

    const html = await response.text();

    // İlk iframe'yi tespit et
    const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    let iframeHtml = '';
    if (iframeMatch && iframeMatch[1]) {
      let iframeUrl = iframeMatch[1];

      // Göreli linkse absolute yap
      if (!iframeUrl.startsWith('http')) {
        iframeUrl = `https://macizlevip315.shop${iframeUrl.startsWith('/') ? '' : '/'}${iframeUrl}`;
      }

      const iframeRes = await fetch(iframeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': targetUrl,
          'Origin': 'https://macizlevip315.shop'
        },
        timeout: 10000
      });

      iframeHtml = await iframeRes.text();
    }

    // Ana sayfa + iframe HTML birleştir
    const combinedHtml = html + '\n' + iframeHtml;

    // M3U8 linklerini ara
    const regex = /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi;
    let matches = [];
    let match;
    while ((match = regex.exec(combinedHtml)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }

    if (matches.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'M3U8 linki bulunamadı (iframe dahil)' })
      };
    }

    // Dilersen linke HEAD isteği atıp canlı mı diye test edebilirsin

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
