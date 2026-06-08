// Cloudflare Worker — atlant-form
// GREEN_API_TOKEN задай в Settings → Variables and Secrets

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const INSTANCE_ID = '7107636880';

export default {
  async fetch(request, env) {

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400);
    }

    const { chatId, message } = body;
    if (!chatId || !message) {
      return json({ ok: false, error: 'chatId and message are required' }, 400);
    }

    const token = env.GREEN_API_TOKEN;
    if (!token) {
      return json({ ok: false, error: 'GREEN_API_TOKEN not set in Worker environment' }, 500);
    }

    const url = `https://api.green-api.com/waInstance${INSTANCE_ID}/sendMessage/${token}`;

    const greenRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    });

    const data = await greenRes.json().catch(() => ({}));

    if (!greenRes.ok) {
      return json({ ok: false, error: 'Green API error', status: greenRes.status, detail: data }, 502);
    }

    // Форма проверяет data.idMessage — возвращаем как есть
    return json(data, 200);
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
