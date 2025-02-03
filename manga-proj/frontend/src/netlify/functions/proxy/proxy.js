const fetch = require('node-fetch');
const CACHE = new Map();

exports.handler = async (event, context) => {
  const path = event.path.replace('/.netlify/functions/proxy', '');
  const url = `https://api.jikan.moe/v4${path}`;

  // Cache check
  if (CACHE.has(url)) {
    const { data, timestamp } = CACHE.get(url);
    if (Date.now() - timestamp < 300000) { // 5-minute cache
      return {
        statusCode: 200,
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }

  try {
    const response = await fetch(url);

    // Handle rate limits
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 1;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return {
        statusCode: 302,
        headers: { Location: `/.netlify/functions/proxy${path}` }
      };
    }

    const data = await response.json();

    // Store in cache
    CACHE.set(url, {
      data,
      timestamp: Date.now()
    });

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API unavailable" }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
