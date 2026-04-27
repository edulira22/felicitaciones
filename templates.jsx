// ============ TEMPLATES ============
// background-image se aplica directo en el contenedor — no hay img ni div hijo.
// Así border-radius clipea el bg nativamente sin overflow:hidden ni html2canvas workarounds.

const bgPhoto = (src) => src
  ? { backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center" }
  : {};

const Placeholder = () => <div className="ph-placeholder">Foto</div>;

// Decorative star SVG
const Star = ({ size = 24, x, y, opacity = 0.7, rotate = 0 }) => (
  <svg className="star" style={{ left: x, top: y, width: size, height: size, opacity, transform: `rotate(${rotate}deg)` }} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1 L14.5 9 L23 12 L14.5 15 L12 23 L9.5 15 L1 12 L9.5 9 Z" />
  </svg>
);

const sigSub = (occ) => {
  if (occ === "condolencias") return "Con sentido pésame";
  if (occ === "extraordinaria") return "Sinceras felicitaciones";
  return "Con mucho cariño";
};

// ============ TEMPLATE 1: CONSTELACIÓN ============
const TplConstelacion = ({ data, occasion }) => {
  const occClass = occasion === "condolencias" ? "is-cond" : occasion === "extraordinaria" ? "is-extra" : "";
  const eyebrow = occasion === "condolencias" ? "En memoria de" : occasion === "extraordinaria" ? "Una ocasión para celebrar" : null;
  return (
    <div className={`card tpl-constelacion ${occClass}`}>
      <div className="starfield" />
      <div className="grain" />

      <Star size={38} x={90} y={260} opacity={0.9} />
      <Star size={22} x={180} y={360} opacity={0.55} rotate={20} />
      <Star size={30} x={920} y={290} opacity={0.8} rotate={15} />
      <Star size={18} x={860} y={420} opacity={0.5} />
      <Star size={26} x={100} y={1080} opacity={0.7} rotate={30} />
      <Star size={36} x={940} y={1120} opacity={0.85} rotate={-10} />
      <Star size={20} x={140} y={1540} opacity={0.55} />
      <Star size={28} x={900} y={1580} opacity={0.7} rotate={45} />
      <Star size={16} x={500} y={180} opacity={0.4} />
      <Star size={14} x={580} y={1780} opacity={0.4} />

      <div className="ornament-top">
        <span className="line" /><span className="dot" /><span className="line" />
      </div>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <div className="headline">{data.headline}</div>

      {/* Anillo dorado: photo-ring > photo-gap > photo-frame > img (border-radius en img, sin overflow:hidden en padre) */}
      <div className="photo-ring">
        <div className="photo-gap">
          <div className="photo-frame">
            {data.photo ? <img className="photo-img" src={data.photo} alt="" /> : <Placeholder />}
          </div>
        </div>
      </div>

      <div className="name">{data.name || "Nombre Apellido"}</div>
      <div className="name-rule">
        <span className="l" /><span className="s">★</span><span className="l" />
      </div>
      <div className="message">{data.message}</div>

      <div className="signature">
        <div className="sig-name">{data.signName}</div>
        <div className="sig-sub">{sigSub(occasion)}</div>
      </div>
      <div className="vignette" />
    </div>
  );
};

// ============ TEMPLATE 2: ATELIER ============
const TplAtelier = ({ data, occasion }) => {
  const occClass = occasion === "condolencias" ? "is-cond" : occasion === "extraordinaria" ? "is-extra" : "";
  const eyebrow = occasion === "condolencias" ? "In Memoriam" : occasion === "extraordinaria" ? "Una Ocasión Memorable" : "Una Felicitación Para";
  return (
    <div className={`card tpl-atelier ${occClass}`}>
      <div className="paper-tex" />
      <div className="corner tl" /><div className="corner tr" />
      <div className="corner bl" /><div className="corner br" />

      <div className="eyebrow">{eyebrow}</div>
      <div className="headline">{data.headline}</div>
      <div className="divider">
        <span className="l" /><span className="d" /><span className="l" />
      </div>

      <div className="photo-frame" style={bgPhoto(data.photo)}>
        {!data.photo && <Placeholder />}
      </div>

      <div className="name">{data.name || "Nombre Apellido"}</div>
      <div className="message">"{data.message}"</div>
      <div className="signature">
        <div className="sig-name">{data.signName}</div>
        <div className="sig-sub">{sigSub(occasion)}</div>
      </div>
    </div>
  );
};

// ============ TEMPLATE 3: EDITORIAL ============
const TplEditorial = ({ data, occasion }) => {
  const occClass = occasion === "condolencias" ? "is-cond" : occasion === "extraordinaria" ? "is-extra" : "";
  const number = occasion === "condolencias" ? "∞" : occasion === "extraordinaria" ? "★" : "N°";
  const mastLabel = occasion === "condolencias" ? "Homenaje · En Memoria" : occasion === "extraordinaria" ? "Honor al Mérito" : "Día Especial";
  const mastRight = occasion === "condolencias" ? "Con respeto" : occasion === "extraordinaria" ? "Edición especial" : "Edición íntima";
  const words = (data.headline || "").split(" ");
  const mid = Math.ceil(words.length / 2);

  return (
    <div className={`card tpl-editorial ${occClass}`}>
      <div className="grain" />
      <div className="masthead">
        <div className="left">{mastLabel}</div>
        <div className="right">{mastRight}</div>
      </div>
      <div className="number">{number}<small></small></div>
      <div className="headline">
        {words.slice(0, mid).join(" ")}<br/><em>{words.slice(mid).join(" ")}</em>
      </div>

      <div className="photo-frame" style={bgPhoto(data.photo)}>
        {!data.photo && <Placeholder />}
      </div>

      <div className="photo-caption">
        <div className="cap-label">{occasion === "condolencias" ? "En memoria de" : "Dedicado a"}</div>
        <div className="cap-name">{data.name || "Nombre Apellido"}</div>
        <div className="cap-text">"{data.message}"</div>
      </div>
      <div className="folio">
        <div>
          <div className="sig">{data.signName}</div>
          <div className="sig-sub">{sigSub(occasion)}</div>
        </div>
        <div className="meta">Morelia · Michoacán<br/>MMXXVI</div>
      </div>
    </div>
  );
};

// ============ TEMPLATE 4: RETRATO ============
const TplRetrato = ({ data, occasion }) => {
  const occClass = occasion === "condolencias" ? "is-cond" : occasion === "extraordinaria" ? "is-extra" : "";
  const eyebrow = occasion === "condolencias" ? "Descanse en paz" : occasion === "extraordinaria" ? "Una distinción merecida" : "Hoy celebramos a";
  const tag = occasion === "condolencias" ? "HOMENAJE" : occasion === "extraordinaria" ? "ENHORABUENA" : "FELICITACIÓN";
  return (
    <div className={`card tpl-retrato ${occClass}`}>
      <div className="photo-full" style={bgPhoto(data.photo)}>
        {!data.photo && <div className="ph-placeholder" style={{fontSize:48}}>Sube una foto</div>}
      </div>
      <div className="scrim" />
      <div className="corner-deco">
        <div className="cd-l"><span className="bar" /><span className="tx">{tag}</span></div>
        <div className="cd-r">Michoacán<br/>MMXXVI</div>
      </div>
      <div className="headline">{data.headline}</div>
      <div className="bottom-block">
        <div className="eyebrow">{eyebrow}</div>
        <div className="name">{data.name || "Nombre Apellido"}</div>
        <div className="message">{data.message}</div>
        <div className="signature">
          <div><div className="sig-name">{data.signName}</div></div>
          <div className="sig-sub">{sigSub(occasion)}</div>
        </div>
      </div>
    </div>
  );
};

window.Templates = [
  { id: "constelacion", name: "Constelación", component: TplConstelacion },
  { id: "atelier", name: "Atelier", component: TplAtelier },
  { id: "editorial", name: "Editorial", component: TplEditorial },
  { id: "retrato", name: "Retrato", component: TplRetrato },
];
