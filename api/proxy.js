const fetch = require('node-fetch');

exports.handler = async (event) => {
  const targetUrl = event.queryStringParameters?.url;
  if (!targetUrl || !/^https?:\/\/.+/.test(targetUrl)) {
    return {
      statusCode: 400,
      body: 'Geçersiz URL',
    };
  }

  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.arrayBuffer();

    return {
      statusCode: 200,
      headers: { 'Content-Type': contentType },
      body: Buffer.from(body).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Proxy hatası: ${err.message}`,
    };
  }
};
