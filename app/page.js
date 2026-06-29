"use client";
import { useState, useEffect, useMemo } from "react";
import "./globals.css";

const fmt = (n) => "$ " + Number(n || 0).toLocaleString("es-AR");
const ytId = (u) => { const m = String(u || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/); return m ? m[1] : ""; };

export default function Page() {
  const [productos, setProductos] = useState([]);
  const [video, setVideo] = useState("");
  const [cats, setCats] = useState([]);
  const [catSel, setCatSel] = useState("Todo");
  const [cart, setCart] = useState({}); // key -> {item, qty}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openCheckout, setOpenCheckout] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/productos").then(r => r.json()).then(d => {
      if (d.ok) {
        setProductos(d.productos || []);
        setVideo(d.video || "");
        const orden = d.categorias && d.categorias.length ? d.categorias : [...new Set((d.productos || []).map(p => p.cat))];
        setCats(orden.filter(c => (d.productos || []).some(p => p.cat === c)));
      } else setError(d.error || "No se pudo cargar el catálogo.");
    }).catch(() => setError("No se pudo cargar el catálogo.")).finally(() => setLoading(false));
  }, []);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2400); };

  const keyOf = (p, vi) => `${p.cat}||${p.n}||${vi}`;
  const setQty = (p, vi, delta) => {
    const k = keyOf(p, vi);
    setCart(prev => {
      const cur = prev[k]?.qty || 0;
      const next = Math.max(0, cur + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[k];
      else copy[k] = { item: { categoria: p.cat, nombre: p.n, pres: p.v[vi][0], precio: p.v[vi][1] }, qty: next };
      return copy;
    });
  };
  const qtyOf = (p, vi) => cart[keyOf(p, vi)]?.qty || 0;
  const prodActive = (p) => p.v.some((_, vi) => qtyOf(p, vi) > 0);

  const lines = useMemo(() => Object.entries(cart).map(([k, v]) => ({ k, ...v.item, cant: v.qty, subtotal: v.item.precio * v.qty })), [cart]);
  const total = lines.reduce((s, l) => s + l.subtotal, 0);
  const count = lines.reduce((s, l) => s + l.cant, 0);

  const visibles = catSel === "Todo" ? cats : [catSel];

  return (
    <>
      <div className="topbar">
        <div className="inner">
          <div className="brandmark"><span className="leaf">🌿</span> Fundación Daicad</div>
          <button className="cart-btn" onClick={() => count && setOpenCheckout(true)}>
            🛒 Pedido <span className="count">{count}</span>
          </button>
        </div>
      </div>

      <header className="hero">
        <span className="eyebrow">Taller Laboral</span>
        <h1>Productos hechos<br />por los chicos</h1>
        <p>Con tu pedido ayudás a fortalecer la autonomía de quienes participan en el Taller Laboral: aprenden a organizarse, planificar y trabajar en equipo. Una vez realizado el pedido te contactamos para coordinar la entrega.</p>
        {ytId(video) && (
          <div className="video-box">
            <div className="vtitle">▶ Mirá el taller en acción</div>
            <div className="ratio"><iframe src={`https://www.youtube.com/embed/${ytId(video)}`} title="Taller Daicad" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div>
          </div>
        )}
      </header>

      <div className="wrap">
        {cats.length > 1 && (
          <div className="tabs">
            <button className={`tab ${catSel === "Todo" ? "active" : ""}`} onClick={() => setCatSel("Todo")}>Todo</button>
            {cats.map(c => <button key={c} className={`tab ${catSel === c ? "active" : ""}`} onClick={() => setCatSel(c)}>{c}</button>)}
          </div>
        )}

        {loading && <div className="empty">Cargando productos…</div>}
        {error && <div className="empty" style={{ color: "#c0492f" }}>{error}</div>}

        {!loading && !error && visibles.map(cat => {
          const items = productos.filter(p => p.cat === cat);
          if (!items.length) return null;
          return (
            <section key={cat}>
              <div className="cat-head">{cat}<span className="ln" /></div>
              <div className="grid">
                {items.map((p, pi) => (
                  <div key={pi} className={`product ${prodActive(p) ? "active" : ""}`}>
                    <div className="prod-top">
                      <div className={`thumb ${p.img ? "" : "ph"}`}>
                        {p.img && <img src={p.img} alt={p.n} loading="lazy" onError={(e) => { e.currentTarget.parentNode.classList.add("ph"); e.currentTarget.remove(); }} />}
                      </div>
                      <div className="prod-info">
                        <h3>{p.n}</h3>
                        {p.d && <div className="desc">{p.d}</div>}
                      </div>
                    </div>
                    <div className="variants">
                      {p.v.map((v, vi) => (
                        <div className="variant" key={vi}>
                          <div className="v-label"><span className="v-pres">{v[0]}</span><span className="v-price">{fmt(v[1])}</span></div>
                          <div className="stepper">
                            <button onClick={() => setQty(p, vi, -1)} disabled={qtyOf(p, vi) === 0}>−</button>
                            <span className="qty">{qtyOf(p, vi)}</span>
                            <button onClick={() => setQty(p, vi, 1)}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="bar">
        <div className="inner">
          <div>
            <div className="tot-label">Total del pedido</div>
            <div className="tot">{fmt(total)}</div>
            <div className="tot-count">{count} {count === 1 ? "producto" : "productos"}</div>
          </div>
          <button className="btn-primary" disabled={!count} onClick={() => setOpenCheckout(true)}>Continuar</button>
        </div>
      </div>

      {openCheckout && (
        <Checkout lines={lines} total={total} onClose={() => setOpenCheckout(false)}
          onChangeQty={(l, d) => {
            const [cat, n, vi] = l.k.split("||");
            const p = productos.find(x => x.cat === cat && x.n === n);
            if (p) setQty(p, Number(vi), d);
          }}
          onDone={() => { setCart({}); setOpenCheckout(false); }}
          showToast={showToast} />
      )}

      {toast && <div className="toast show">{toast}</div>}
    </>
  );
}

function Checkout({ lines, total, onClose, onChangeQty, onDone, showToast }) {
  const [nombre, setNombre] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [metodo, setMetodo] = useState("transferencia");
  const [comp, setComp] = useState(null); // {name,mime,base64}
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(null); // nro

  const copiar = () => navigator.clipboard.writeText("fundaciondaicad.mp").then(() => showToast("Alias copiado ✓"));

  const onFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { showToast("El archivo supera los 4 MB"); return; }
    const b64 = await fileToCompressedBase64(file);
    setComp({ name: file.name, mime: b64.mime, base64: b64.data });
  };

  const enviar = async () => {
    if (!nombre || !tel || !email) { showToast("Completá tus datos"); return; }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) { showToast("Revisá el correo"); return; }
    if (!lines.length) { showToast("Tu pedido está vacío"); return; }
    if (metodo === "transferencia" && !comp) { showToast("Adjuntá el comprobante"); return; }
    setEnviando(true);
    try {
      const r = await fetch("/api/pedido", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre, telefono: tel, email, total, metodoPago: metodo,
          items: lines.map(l => ({ categoria: l.categoria, nombre: l.nombre, pres: l.pres, precio: l.precio, cant: l.cant, subtotal: l.subtotal })),
          comprobante: metodo === "transferencia" ? comp : null
        })
      });
      const d = await r.json();
      if (d.ok) setHecho(d.nroPedido);
      else { showToast(d.error || "No se pudo enviar"); setEnviando(false); }
    } catch { showToast("Error de conexión. Probá de nuevo."); setEnviando(false); }
  };

  return (
    <div className="overlay" onClick={(e) => { if (e.target.className === "overlay" && !enviando) onClose(); }}>
      <div className="drawer">
        {hecho ? (
          <div className="confirm">
            <div className="em">🌿</div>
            <h2>¡Pedido recibido!</h2>
            <div className="nro">Pedido N° {hecho}</div>
            <p style={{ color: "var(--soft)", maxWidth: 360, margin: "6px auto 22px" }}>
              Gracias {nombre.split(" ")[0]}. Te vamos a contactar al {tel} para coordinar la entrega. Anotá tu número: <b>{hecho}</b>.
            </p>
            <button className="btn-primary" onClick={onDone}>Hacer otro pedido</button>
          </div>
        ) : (
          <>
            <button className="close" onClick={() => !enviando && onClose()}>✕</button>
            <h2>Tu pedido</h2>
            <div style={{ marginTop: 14 }}>
              {lines.map(l => (
                <div className="line-item" key={l.k}>
                  <div>
                    <div className="li-cat">{l.categoria}</div>
                    <div className="li-name">{l.nombre} · {l.pres}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="stepper">
                      <button onClick={() => onChangeQty(l, -1)}>−</button>
                      <span className="qty">{l.cant}</span>
                      <button onClick={() => onChangeQty(l, 1)}>+</button>
                    </div>
                    <span style={{ fontWeight: 700, minWidth: 78, textAlign: "right" }}>{fmt(l.subtotal)}</span>
                  </div>
                </div>
              ))}
              <div className="line-item" style={{ fontWeight: 800, color: "var(--green-deep)", fontSize: "1.1rem" }}>
                <span>Total</span><span>{fmt(total)}</span>
              </div>
            </div>

            <div className="field"><label>Nombre y Apellido</label><input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. María González" /></div>
            <div className="field"><label>Teléfono</label><input value={tel} onChange={e => setTel(e.target.value)} placeholder="11 5555 5555" /></div>
            <div className="field"><label>Correo</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" /></div>

            <div className="pay-methods">
              <button className={`pm ${metodo === "transferencia" ? "active" : ""}`} onClick={() => setMetodo("transferencia")}>
                <span className="ico">💳</span><span className="t">Transferencia</span><span className="s">Mercado Pago + comprobante</span>
              </button>
              <button className={`pm ${metodo === "efectivo" ? "active" : ""}`} onClick={() => { setMetodo("efectivo"); setComp(null); }}>
                <span className="ico">💵</span><span className="t">Efectivo</span><span className="s">Pagás en la entrega</span>
              </button>
            </div>

            {metodo === "transferencia" ? (
              <>
                <div className="alias"><span>fundaciondaicad.mp</span><button className="copy-btn" onClick={copiar}>Copiar alias</button></div>
                <label className={`upload-btn ${comp ? "has" : ""}`}>
                  <span className="t">{comp ? `📎 ${comp.name}` : "📎 Adjuntar comprobante"}</span>
                  <span className="h">{comp ? "Listo ✓" : "Imagen o PDF · máx. 4 MB"}</span>
                  <input type="file" accept="image/*,application/pdf" hidden onChange={onFile} />
                </label>
              </>
            ) : (
              <div className="note">Pagás <b>en efectivo</b> cuando coordinemos la entrega. No hace falta adjuntar nada ahora.</div>
            )}

            <button className="btn-primary" style={{ width: "100%", marginTop: 18 }} disabled={enviando} onClick={enviar}>
              {enviando ? <><span className="spin" />Enviando…</> : "Enviar pedido"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Comprime imágenes grandes (a máx 1600px) para no exceder el límite de subida; PDFs van tal cual.
function fileToCompressedBase64(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = () => resolve({ mime: file.type, data: r.result.split(",")[1] });
      r.readAsDataURL(file);
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1600; let { width, height } = img;
        if (width > max || height > max) { const k = max / Math.max(width, height); width = Math.round(width * k); height = Math.round(height * k); }
        const c = document.createElement("canvas"); c.width = width; c.height = height;
        c.getContext("2d").drawImage(img, 0, 0, width, height);
        const dataUrl = c.toDataURL("image/jpeg", 0.82);
        resolve({ mime: "image/jpeg", data: dataUrl.split(",")[1] });
      };
      img.onerror = () => { const r2 = new FileReader(); r2.onload = () => resolve({ mime: file.type, data: r2.result.split(",")[1] }); r2.readAsDataURL(file); };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
