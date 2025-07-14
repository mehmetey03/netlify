const fetch = require('node-fetch');

exports.handler = async function(event) {
  const targetUrl = event.queryStringParameters?.url;
  if (!targetUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'URL parametresi gerekli' }),
    };
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://macizlevip315.shop/',
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Hata: ${response.statusText}` }),
      };
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
      let body = await response.text();

      body = body
        .split('\n')
        .map((line) => {
          if (line && !line.startsWith('#') && (line.endsWith('.ts') || line.startsWith('http'))) {
            return `/.netlify/functions/proxy?url=${encodeURIComponent(line.trim())}`;
          }
          return line;
        })
        .join('\n');

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl' },
        body,
      };
    }

    const buffer = await response.buffer();
    return {
      statusCode: 200,
      headers: { 'Content-Type': contentType },
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy hatası', message: error.message }),
    };
  }
};
