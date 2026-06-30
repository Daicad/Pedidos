// GET /api/productos -> lee el catálogo desde el Apps Script (lado servidor, sin CORS).
// Sin caché en Vercel: siempre pide el dato actual. La velocidad la da el caché
// interno de Apps Script, que se limpia solo al guardar desde el panel.
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.APPSCRIPT_URL;
  if (!url) return Response.json({ ok: false, error: 'Falta APPSCRIPT_URL' }, { status: 500 });
  try {
    const r = await fetch(url + '?api=productos', { cache: 'no-store' });
    const data = await r.json();
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
