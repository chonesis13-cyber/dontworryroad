export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { url } = req.query;
  if (!url) { res.status(400).json({ error: 'url parameter required' }); return; }

  const decodedUrl = decodeURIComponent(url);
  const MAX_RETRY = 2;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25초

      const response = await fetch(decodedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DontWorryRoad/1.0)',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate',
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
      return; // 성공 시 종료

    } catch (e) {
      if (attempt === MAX_RETRY) {
        // 마지막 재시도도 실패
        if (e.name === 'AbortError') {
          res.status(504).json({ error: 'timeout', message: '서울시 API 응답 시간 초과' });
        } else {
          res.status(500).json({ error: e.message });
        }
      } else {
        // 재시도 전 1초 대기
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
}

export const config = {
  api: { responseLimit: '10mb' },
  maxDuration: 30, // Vercel 함수 최대 실행시간 30초
};
