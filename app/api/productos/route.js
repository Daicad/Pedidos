// GET /api/productos -> lee el catálogo desde el Apps Script (lado servidor, sin CORS).
export const revalidate = 60; // cachea 60s para que sea rápido

export async function GET() {
  const url = process.env.APPSCRIPT_URL;
  if (!url) return Response.json({ ok: false, error: 'Falta APPSCRIPT_URL' }, { status: 500 });
  try {
    const r = await fetch(url + '?api=productos', { next: { revalidate: 60 } });
    const data = await r.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
