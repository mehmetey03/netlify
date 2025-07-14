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
        'Accept': '*/*',
        'Referer': 'https://macizlevip315.shop/',
        'Origin': 'https://macizlevip315.shop',
      },
      timeout: 10000,
    });

    const html = await response.text();

    // iframe içeriğini al
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/i;
    const iframeMatch = html.match(iframeRegex);
    let iframeHtml = '';
    if (iframeMatch && iframeMatch[1]) {
      const iframeUrl = iframeMatch[1].startsWith('http')
        ? iframeMatch[1]
        : `https://macizlevip315.shop/${iframeMatch[1]}`;
      const iframeRes = await fetch(iframeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': targetUrl
        },
        timeout: 10000
      });
      iframeHtml = await iframeRes.text();
    }

    const combined = html + '\n' + iframeHtml;

    // 1. JSON içinde geçen linkleri tara
    const jsonRegex = /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi;
    const jsonMatches = [...combined.matchAll(jsonRegex)].map(m => m[1]);

    // 2. Veri attribute'larında gizlenmiş linkleri ara (örneğin: data-stream="...m3u8")
    const dataAttrRegex = /data-[a-zA-Z0-9-]+=["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi;
    const dataMatches = [...combined.matchAll(dataAttrRegex)].map(m => m[1]);

    // 3. Herhangi bir JS fonksiyonu içinde .m3u8 geçen linkleri tara
    const looseRegex = /(https?:\/\/[^"'<> ]+\.m3u8[^"'<> ]*)/gi;
    const looseMatches = [...combined.matchAll(looseRegex)].map(m => m[1]);

    // Tek bir liste oluştur
    const allMatches = Array.from(new Set([...jsonMatches, ...dataMatches, ...looseMatches]));

    if (allMatches.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'M3U8 linki hâlâ bulunamadı (JSON/data/script loose tarandı)',
          debug: {
            jsonMatches,
            dataMatches,
            looseMatches
          }
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: allMatches[0], id })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'İşlem hatası', message: err.message }),
    };
  }
};
