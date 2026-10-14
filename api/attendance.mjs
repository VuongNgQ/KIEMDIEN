import { handler } from '../server/vuonq-api.mjs';

// Translate Vercel's Node request into the existing VUONQ API contract.
export default async function attendance(request, response) {
  try {
    const url = new URL(request.url || '/api/attendance', 'https://vuonq.local');
    const queryStringParameters = Object.fromEntries(url.searchParams.entries());
    const event = {
      queryStringParameters,
      headers: request.headers || {},
      body: request.body == null
        ? undefined
        : typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body),
    };
    const result = await handler(event);
    for (const [name, value] of Object.entries(result.headers || {})) {
      if (name.toLowerCase() !== 'access-control-allow-origin') response.setHeader(name, value);
    }
    response.status(result.statusCode || 200).send(result.body || '');
  } catch (error) {
    console.error('VUONQ Vercel adapter:', error.message);
    response.status(500).json({ ok: false, error: 'Lỗi xử lý yêu cầu API.' });
  }
}
