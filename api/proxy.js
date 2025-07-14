const fetch = require('node-fetch');

exports.handler = async function(event) {
  const targetUrl = event.queryStringParameters?.url;
  if (!targetUrl) {
    return { statusCode: 400, body: 'URL parametresi gerekli' };
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://macizlevip315.shop/'
      }
    });

    if (!response.ok) {
      return { statusCode: response.status, body: 'Hata: ' + response.statusText };
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
      let body = await response.text();
      // m3u8 içindeki ts segmentlerini proxy ile değiştir
      body = body.split('\n').map(line => {
        if (line && !line.startsWith('#') && (line.endsWith('.ts') || line.startsWith('http'))) {
          return `/.netlify/functions/proxy?url=${encodeURIComponent(line.trim())}`;
        }
        return line;
      }).join('\n');

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl' },
        body
      };
    }

    // Diğer dosyaları direkt ilet
    const buffer = await response.buffer();
    return {
      statusCode: 200,
      headers: { 'Content-Type': contentType },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: 'Proxy hatası: ' + error.message
    };
  }
};
