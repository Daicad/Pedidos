// POST /api/pedido -> reenvía el pedido al Apps Script agregando el token (lado servidor).
export const maxDuration = 60;

export async function POST(req) {
  const url = process.env.APPSCRIPT_URL;
  const token = process.env.APPSCRIPT_TOKEN;
  if (!url || !token) return Response.json({ ok: false, error: 'Faltan variables de entorno' }, { status: 500 });
  try {
    const body = await req.json();
    const payload = { ...body, token };
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { ok: false, error: 'Respuesta no válida del servidor' }; }
    return Response.json(data);
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
