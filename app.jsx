const { useState, useEffect, useRef, useMemo } = React;

// ============ CONTENT DEFAULTS per occasion ============
const OCCASIONS = {
  cumpleanos: {
    label: "Cumpleaños",
    headlineOptions: ["Feliz Cumpleaños", "Muchas Felicidades", "Un año más"],
    defaultHeadline: "Feliz Cumpleaños",
    defaultMessage: "Que este nuevo año te traiga salud, alegría y la fuerza para cumplir cada uno de tus sueños. Te deseo lo mejor, con mucho cariño.",
  },
  condolencias: {
    label: "Condolencias",
    headlineOptions: ["Descansa en paz", "En memoria", "Siempre en el corazón"],
    defaultHeadline: "Descansa en paz",
    defaultMessage: "Mi más sentido pésame a la familia. Que encuentren consuelo en los recuerdos y en el legado que deja entre nosotros. Un fuerte abrazo en estos momentos difíciles.",
  },
  extraordinaria: {
    label: "Felicitación Extraordinaria",
    headlineOptions: ["¡Enhorabuena!", "Muchas Felicidades", "Logro Merecido"],
    defaultHeadline: "¡Enhorabuena!",
    defaultMessage: "Un logro que honra el esfuerzo, la dedicación y la disciplina. Te felicito de corazón por este momento que marca un capítulo inolvidable. Sigue conquistando metas.",
  },
};

const makeInitialData = (occ) => ({
  photo: null,
  name: "",
  headline: OCCASIONS[occ].defaultHeadline,
  message: OCCASIONS[occ].defaultMessage,
  signName: "Lic. Yair Pérez",
});

const Icon = ({ name, size = 16 }) => {
  const paths = {
    upload: "M12 3v13m0-13l-4 4m4-4l4 4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2",
    trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0l-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6",
    download: "M12 3v12m0 0l-4-4m4 4l4-4M5 21h14",
    reset: "M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5",
    plus: "M12 5v14m-7-7h14",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zm11-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
};

function App() {
  const [occasion, setOccasion] = useState("cumpleanos");
  const [tplId, setTplId] = useState("constelacion");
  const [data, setData] = useState(() => makeInitialData("cumpleanos"));
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [stageScale, setStageScale] = useState(0.4);
  // Mobile tab: "editor" | "preview"
  const [mobileTab, setMobileTab] = useState("editor");
  const [isMobile, setIsMobile] = useState(false);

  const stageRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const fit = () => {
      if (!stageRef.current) return;
      const { clientWidth, clientHeight } = stageRef.current;
      const padding = isMobile ? 24 : 60;
      const sx = (clientWidth - padding * 2) / 1080;
      const sy = (clientHeight - padding * 2) / 1920;
      setStageScale(Math.min(sx, sy, isMobile ? 0.35 : 0.6));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [isMobile]);

  const handleOccasion = (newOcc) => {
    setOccasion(newOcc);
    setData((d) => ({
      ...d,
      headline: OCCASIONS[newOcc].defaultHeadline,
      message: OCCASIONS[newOcc].defaultMessage,
    }));
  };

  const handlePhoto = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      // Draw on canvas to bake in EXIF rotation — html2canvas ignores EXIF
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        setData((d) => ({ ...d, photo: c.toDataURL("image/jpeg", 0.93) }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => setData((d) => ({ ...d, photo: null }));

  const resetDefaults = () => {
    const init = makeInitialData(occasion);
    setData((d) => ({ ...init, name: d.name, photo: d.photo, signName: d.signName }));
    showToast("Mensaje restablecido");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const download = async () => {
    if (!data.name.trim()) { showToast("Falta el nombre"); return; }
    if (!data.photo) { showToast("Falta la foto"); return; }
    setBusy(true);
    try {
      const safe = (data.name || "post").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase();
      const filename = `${OCCASIONS[occasion].label.toLowerCase().replace(/\s/g, "-")}-${safe}.png`;

      // Try local Puppeteer render server first (100% fidelity)
      let blob = null;
      try {
        const resp = await fetch("http://localhost:3001/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template: tplId,
            occasion,
            name: data.name,
            headline: data.headline,
            message: data.message,
            signName: data.signName,
            photo: data.photo,
          }),
        });
        if (resp.ok) blob = await resp.blob();
      } catch (_) { /* server not running, fall through */ }

      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = filename;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast("Descarga lista ✓");
      } else {
        // Fallback: html2canvas
        const card = cardRef.current.querySelector(".card");
        const wrap = cardRef.current;
        const prev = wrap.style.transform;
        wrap.style.transform = "scale(1)";
        await new Promise((r) => setTimeout(r, 150));
        const canvas = await html2canvas(card, { width:1080, height:1920, scale:2, useCORS:true, backgroundColor:null, logging:false });
        wrap.style.transform = prev;
        const link = document.createElement("a");
        link.download = filename;
        link.href = canvas.toDataURL("image/png");
        link.click();
        showToast("Descarga lista ✓ (modo básico)");
      }
    } catch (err) {
      console.error(err);
      showToast("Error al descargar");
    } finally {
      setBusy(false);
    }
  };

  const Template = useMemo(() => {
    return window.Templates.find((t) => t.id === tplId)?.component || window.Templates[0].component;
  }, [tplId]);

  const panelContent = (
    <>
      <div className="panel-head">
        <div className="monogram">Y</div>
        <div>
          <div className="brand-name">Felicitaciones</div>
          <div className="brand-sub">Lic. Yair Pérez</div>
        </div>
      </div>

      <div className="panel-body">
        {/* OCCASION */}
        <div className="section-label">Ocasión</div>
        <div className="occasion-tabs">
          {Object.entries(OCCASIONS).map(([k, v]) => (
            <button
              key={k}
              className={`occasion-tab ${occasion === k ? "active" : ""}`}
              onClick={() => handleOccasion(k)}
            >
              {k === "extraordinaria" ? "Logro" : v.label}
            </button>
          ))}
        </div>

        {/* PHOTO */}
        <div className="section-label">Foto <span className="required-dot" /></div>
        {!data.photo ? (
          <label className="photo-drop">
            <div className="photo-drop-icon"><Icon name="upload" size={20} /></div>
            <div className="photo-drop-text">
              <b>Sube una foto</b><br/>
              <small>JPG o PNG · de preferencia cuadrada</small>
            </div>
            <input type="file" accept="image/*" style={{display:"none"}} onChange={(e) => handlePhoto(e.target.files[0])} />
          </label>
        ) : (
          <label className="photo-drop has-photo">
            <img src={data.photo} className="photo-thumb" alt="" />
            <div className="photo-drop-text">
              <b>Foto cargada</b><br/>
              <small>Haz clic para reemplazar</small>
            </div>
            <input type="file" accept="image/*" style={{display:"none"}} onChange={(e) => handlePhoto(e.target.files[0])} />
            <div className="photo-actions" onClick={(e) => e.preventDefault()}>
              <button className="icon-btn danger" onClick={(e) => {e.preventDefault(); e.stopPropagation(); removePhoto();}}>
                <Icon name="trash" size={13} />
              </button>
            </div>
          </label>
        )}

        {/* NAME */}
        <div className="section-label" style={{marginTop:22}}>Nombre <span className="required-dot" /></div>
        <div className="field">
          <input
            className="input"
            placeholder="ej. Guadalupe Córdoba"
            value={data.name}
            onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
          />
        </div>

        {/* TEMPLATE PICKER */}
        <div className="section-label">Plantilla</div>
        <div className="templates">
          {window.Templates.map((t) => (
            <button
              key={t.id}
              className={`tpl ${tplId === t.id ? "active" : ""}`}
              onClick={() => setTplId(t.id)}
              title={t.name}
            >
              <div className="tpl-mini">
                <TplThumb id={t.id} occasion={occasion} />
              </div>
              <div className="tpl-label">{t.name}</div>
            </button>
          ))}
        </div>

        {/* ADVANCED */}
        <details style={{marginTop:24}}>
          <summary style={{
            fontSize:11, letterSpacing:".2em", textTransform:"uppercase",
            color:"var(--ink-3)", cursor:"pointer", padding:"8px 0",
            listStyle:"none", userSelect:"none",
          }}>
            ✎ Editar mensaje (opcional)
          </summary>
          <div className="muted-note">
            Los textos ya están escritos para cada ocasión. Edítalos solo si necesitas algo muy específico.
          </div>
          <div className="field" style={{marginTop:14}}>
            <label>Título</label>
            <input
              className="input"
              value={data.headline}
              onChange={(e) => setData((d) => ({ ...d, headline: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Mensaje</label>
            <textarea
              className="textarea"
              rows={4}
              value={data.message}
              onChange={(e) => setData((d) => ({ ...d, message: e.target.value }))}
            />
          </div>
          <button className="icon-btn" onClick={resetDefaults} style={{width:"100%",padding:"10px",marginTop:4}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:8,justifyContent:"center"}}>
              <Icon name="reset" size={13} /> Restablecer mensaje predeterminado
            </span>
          </button>
        </details>
      </div>

      <div className="panel-foot">
        <button className="btn-primary" onClick={download} disabled={busy}>
          <Icon name="download" size={14} />
          {busy ? "Generando…" : "Descargar PNG"}
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="app-mobile">
        {/* Mobile header */}
        <div className="mobile-header">
          <div className="monogram">Y</div>
          <div>
            <div className="brand-name">Felicitaciones</div>
            <div className="brand-sub">Lic. Yair Pérez</div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mobile-tabs">
          <button
            className={`mobile-tab ${mobileTab === "editor" ? "active" : ""}`}
            onClick={() => setMobileTab("editor")}
          >
            <Icon name="edit" size={15} />
            Editor
          </button>
          <button
            className={`mobile-tab ${mobileTab === "preview" ? "active" : ""}`}
            onClick={() => setMobileTab("preview")}
          >
            <Icon name="eye" size={15} />
            Vista previa
          </button>
        </div>

        {/* Editor panel */}
        {mobileTab === "editor" && (
          <div className="mobile-panel">
            <div className="panel-body">
              {/* OCCASION */}
              <div className="section-label">Ocasión</div>
              <div className="occasion-tabs">
                {Object.entries(OCCASIONS).map(([k, v]) => (
                  <button
                    key={k}
                    className={`occasion-tab ${occasion === k ? "active" : ""}`}
                    onClick={() => handleOccasion(k)}
                  >
                    {k === "extraordinaria" ? "Logro" : v.label}
                  </button>
                ))}
              </div>

              {/* PHOTO */}
              <div className="section-label">Foto <span className="required-dot" /></div>
              {!data.photo ? (
                <label className="photo-drop">
                  <div className="photo-drop-icon"><Icon name="upload" size={20} /></div>
                  <div className="photo-drop-text">
                    <b>Sube una foto</b><br/>
                    <small>JPG o PNG · de preferencia cuadrada</small>
                  </div>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={(e) => handlePhoto(e.target.files[0])} />
                </label>
              ) : (
                <label className="photo-drop has-photo">
                  <img src={data.photo} className="photo-thumb" alt="" />
                  <div className="photo-drop-text">
                    <b>Foto cargada</b><br/>
                    <small>Haz clic para reemplazar</small>
                  </div>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={(e) => handlePhoto(e.target.files[0])} />
                  <div className="photo-actions" onClick={(e) => e.preventDefault()}>
                    <button className="icon-btn danger" onClick={(e) => {e.preventDefault(); e.stopPropagation(); removePhoto();}}>
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </label>
              )}

              {/* NAME */}
              <div className="section-label" style={{marginTop:22}}>Nombre <span className="required-dot" /></div>
              <div className="field">
                <input
                  className="input"
                  placeholder="ej. Guadalupe Córdoba"
                  value={data.name}
                  onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                />
              </div>

              {/* TEMPLATE PICKER */}
              <div className="section-label">Plantilla</div>
              <div className="templates">
                {window.Templates.map((t) => (
                  <button
                    key={t.id}
                    className={`tpl ${tplId === t.id ? "active" : ""}`}
                    onClick={() => setTplId(t.id)}
                    title={t.name}
                  >
                    <div className="tpl-mini">
                      <TplThumb id={t.id} occasion={occasion} />
                    </div>
                    <div className="tpl-label">{t.name}</div>
                  </button>
                ))}
              </div>

              {/* ADVANCED */}
              <details style={{marginTop:24}}>
                <summary style={{
                  fontSize:11, letterSpacing:".2em", textTransform:"uppercase",
                  color:"var(--ink-3)", cursor:"pointer", padding:"8px 0",
                  listStyle:"none", userSelect:"none",
                }}>
                  ✎ Editar mensaje (opcional)
                </summary>
                <div className="muted-note">
                  Los textos ya están escritos para cada ocasión. Edítalos solo si necesitas algo muy específico.
                </div>
                <div className="field" style={{marginTop:14}}>
                  <label>Título</label>
                  <input
                    className="input"
                    value={data.headline}
                    onChange={(e) => setData((d) => ({ ...d, headline: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label>Mensaje</label>
                  <textarea
                    className="textarea"
                    rows={4}
                    value={data.message}
                    onChange={(e) => setData((d) => ({ ...d, message: e.target.value }))}
                  />
                </div>
                <button className="icon-btn" onClick={resetDefaults} style={{width:"100%",padding:"10px",marginTop:4}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                    <Icon name="reset" size={13} /> Restablecer predeterminado
                  </span>
                </button>
              </details>

              <div style={{height: 80}} />
            </div>

            <div className="mobile-foot">
              <button className="btn-primary" onClick={() => { setMobileTab("preview"); }} style={{marginBottom:10, background:"var(--bg-3)", color:"var(--ink)", border:"1px solid var(--line)"}}>
                <Icon name="eye" size={14} />
                Ver vista previa
              </button>
              <button className="btn-primary" onClick={download} disabled={busy}>
                <Icon name="download" size={14} />
                {busy ? "Generando…" : "Descargar PNG"}
              </button>
            </div>
          </div>
        )}

        {/* Preview panel */}
        {mobileTab === "preview" && (
          <div className="mobile-stage" ref={stageRef}>
            <div className="stage-label">
              Vista previa · <b>{OCCASIONS[occasion].label}</b> · 1080 × 1920
            </div>
            <div
              ref={cardRef}
              className="card-wrap"
              style={{
                transform: `scale(${stageScale})`,
                width: 1080, height: 1920,
                transformOrigin: "center top",
              }}
            >
              <Template data={data} occasion={occasion} />
            </div>
            <div className="mobile-preview-foot">
              <button className="btn-primary" onClick={download} disabled={busy}>
                <Icon name="download" size={14} />
                {busy ? "Generando…" : "Descargar PNG"}
              </button>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
        {busy && <LoadingOverlay />}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="app">
      <aside className="panel">
        {panelContent}
      </aside>

      <main className="stage" ref={stageRef}>
        <div className="stage-label">
          Vista previa · <b>{OCCASIONS[occasion].label}</b> · 1080 × 1920
        </div>
        <div
          ref={cardRef}
          className="card-wrap"
          style={{
            transform: `scale(${stageScale})`,
            width: 1080, height: 1920,
            transformOrigin: "center center",
          }}
        >
          <Template data={data} occasion={occasion} />
        </div>
      </main>

      {toast && <div className="toast">{toast}</div>}
      {busy && <LoadingOverlay />}
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="loading-spinner" />
        <div className="loading-title">Generando tu felicitación</div>
        <div className="loading-sub">Esto puede tomar unos segundos…</div>
      </div>
    </div>
  );
}

// ============ TEMPLATE THUMBNAIL ============
function TplThumb({ id, occasion }) {
  const isDark = id !== "atelier" || occasion === "condolencias";
  const bg = id === "atelier" && occasion !== "condolencias" ? "#ece4d5" : "#0a0a0c";
  const fg = isDark ? "#fff" : "#2b2520";
  const gold = "#d9b378";

  if (id === "constelacion") {
    return (
      <svg viewBox="0 0 90 160" width="100%" height="100%" style={{background:bg, display:"block"}}>
        <circle cx="12" cy="18" r=".6" fill="#fff" opacity=".7"/>
        <circle cx="78" cy="24" r=".5" fill="#fff" opacity=".5"/>
        <circle cx="30" cy="40" r=".4" fill="#fff" opacity=".5"/>
        <circle cx="65" cy="48" r=".5" fill="#fff" opacity=".7"/>
        <circle cx="15" cy="70" r=".4" fill="#fff" opacity=".4"/>
        <text x="45" y="26" textAnchor="middle" fontFamily="Allura,cursive" fontSize="14" fill={fg}>Feliz</text>
        <circle cx="45" cy="70" r="22" fill="none" stroke={gold} strokeWidth="1.2"/>
        <circle cx="45" cy="70" r="20" fill="#2a2a30"/>
        <text x="45" y="110" textAnchor="middle" fontFamily="Allura,cursive" fontSize="9" fill={fg}>Nombre</text>
        <text x="45" y="122" textAnchor="middle" fontFamily="Inter" fontSize="3.5" fill={fg} opacity=".6">mensaje corto</text>
        <text x="45" y="145" textAnchor="middle" fontFamily="Allura,cursive" fontSize="7" fill={gold}>Yair</text>
      </svg>
    );
  }
  if (id === "atelier") {
    return (
      <svg viewBox="0 0 90 160" width="100%" height="100%" style={{background:bg, display:"block"}}>
        <path d="M6 6 L16 6 L16 7 L7 7 L7 16 L6 16 Z" fill="#8a7558"/>
        <path d="M74 6 L84 6 L84 16 L83 16 L83 7 L74 7 Z" fill="#8a7558"/>
        <path d="M6 154 L6 144 L7 144 L7 153 L16 153 L16 154 Z" fill="#8a7558"/>
        <path d="M84 154 L74 154 L74 153 L83 153 L83 144 L84 144 Z" fill="#8a7558"/>
        <text x="45" y="28" textAnchor="middle" fontFamily="Playfair Display,serif" fontStyle="italic" fontSize="11" fill={fg}>Feliz</text>
        <rect x="24" y="42" width="42" height="56" fill="#ddd" stroke="#fff" strokeWidth="1.5"/>
        <text x="45" y="118" textAnchor="middle" fontFamily="Playfair Display,serif" fontSize="7" fontWeight="600" fill={fg}>Nombre</text>
        <text x="45" y="130" textAnchor="middle" fontFamily="Cormorant,serif" fontStyle="italic" fontSize="4" fill={fg} opacity=".7">"mensaje"</text>
        <text x="45" y="148" textAnchor="middle" fontFamily="Allura,cursive" fontSize="6" fill="#8a7558">Yair</text>
      </svg>
    );
  }
  if (id === "editorial") {
    return (
      <svg viewBox="0 0 90 160" width="100%" height="100%" style={{background:bg, display:"block"}}>
        <line x1="8" y1="14" x2="82" y2="14" stroke="#fff" strokeOpacity=".3"/>
        <text x="8" y="11" fontFamily="Inter" fontSize="3" fill="#fff" opacity=".5">DÍA ESPECIAL</text>
        <text x="82" y="11" textAnchor="end" fontFamily="DM Serif Display,serif" fontSize="4" fontStyle="italic" fill={gold}>ed. íntima</text>
        <text x="8" y="42" fontFamily="DM Serif Display,serif" fontSize="28" fill={gold}>N°</text>
        <text x="82" y="30" textAnchor="end" fontFamily="DM Serif Display,serif" fontSize="10" fill="#fff">Feliz</text>
        <text x="82" y="40" textAnchor="end" fontFamily="DM Serif Display,serif" fontStyle="italic" fontSize="10" fill={gold}>día</text>
        <rect x="8" y="52" width="36" height="54" fill="#2a2a30"/>
        <line x1="50" y1="52" x2="50" y2="106" stroke="#fff" strokeOpacity=".3"/>
        <text x="52" y="58" fontFamily="Inter" fontSize="2.6" fill={gold}>DEDICADO A</text>
        <text x="52" y="70" fontFamily="DM Serif Display,serif" fontSize="6" fill="#fff">Nombre</text>
        <text x="52" y="82" fontFamily="Cormorant,serif" fontStyle="italic" fontSize="3.2" fill="#fff" opacity=".8">"Mensaje del</text>
        <text x="52" y="88" fontFamily="Cormorant,serif" fontStyle="italic" fontSize="3.2" fill="#fff" opacity=".8">día especial."</text>
        <line x1="8" y1="140" x2="82" y2="140" stroke="#fff" strokeOpacity=".3"/>
        <text x="8" y="150" fontFamily="Allura,cursive" fontSize="8" fill={gold}>Yair</text>
      </svg>
    );
  }
  if (id === "retrato") {
    return (
      <svg viewBox="0 0 90 160" width="100%" height="100%" style={{background:bg, display:"block"}}>
        <rect x="0" y="0" width="90" height="160" fill="#3a3a42"/>
        <rect x="0" y="0" width="90" height="160" fill="url(#scrim)"/>
        <defs>
          <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity=".5"/>
            <stop offset=".5" stopColor="#000" stopOpacity=".1"/>
            <stop offset="1" stopColor="#000" stopOpacity=".95"/>
          </linearGradient>
        </defs>
        <text x="8" y="12" fontFamily="Inter" fontSize="3" fill={gold}>FELICITACIÓN</text>
        <text x="8" y="46" fontFamily="Allura,cursive" fontSize="18" fill="#fff">Feliz</text>
        <text x="8" y="130" fontFamily="Inter" fontSize="2.8" fill={gold}>HOY CELEBRAMOS A</text>
        <text x="8" y="140" fontFamily="DM Serif Display,serif" fontSize="7" fill="#fff">Nombre</text>
        <line x1="8" y1="148" x2="35" y2="148" stroke={gold} strokeWidth=".8"/>
        <text x="8" y="155" fontFamily="Allura,cursive" fontSize="6" fill={gold}>Yair</text>
      </svg>
    );
  }
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
