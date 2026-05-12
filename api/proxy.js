export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { url } = req.query;
  if (!url) { res.status(400).json({ error: 'url parameter required' }); return; }

  try {
    const decodedUrl = decodeURIComponent(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

    const response = await fetch(decodedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json, text/plain, */*',
      },
    });

    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('json')) {
      const data = await response.json();
      res.status(200).json(data);
    } else {
      const text = await response.text();
      res.status(200).json({ raw: text });
    }

  } catch (e) {
    if (e.name === 'AbortError') {
      res.status(504).json({ error: 'timeout', message: '서울시 API 응답 시간 초과' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
}

export const config = {
  api: {
    responseLimit: '10mb',
  },
};
