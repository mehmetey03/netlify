const chromium = require('chrome-aws-lambda');
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const targetUrl = decodeURIComponent(event.queryStringParameters?.url || '');
    if (!targetUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'URL parametresi eksik' }),
      };
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://macizlevip315.shop/',
        'Accept': '*/*',
      },
      timeout: 5000,
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `HTTP ${response.status}` }),
      };
    }

    const contentType = response.headers.get('content-type') || '';
    const isM3U8 = contentType.includes('mpegurl') || targetUrl.includes('.m3u8');

    if (isM3U8) {
      let text = await response.text();

      // TS segmentlerini proxy'le
      text = text
        .split('\n')
        .map((line) => {
          if (line.trim() && !line.startsWith('#') && (line.endsWith('.ts') || line.startsWith('http'))) {
            return `/proxy?url=${encodeURIComponent(line.trim())}`;
          }
          return line;
        })
        .join('\n');

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl' },
        body: text,
      };
    }

    // Diğer içeriklerde stream olarak gönder
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
      body: JSON.stringify({ error: `Proxy hatası: ${error.message}` }),
    };
  }
};
