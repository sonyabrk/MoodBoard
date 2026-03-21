const CANVAS_W = 1200;
const CANVAS_H = 800;

function BoardPreview({ layout }) {
  let items = [];
  try {
    const parsed = typeof layout === 'string' ? JSON.parse(layout) : layout;
    items = parsed?.items || [];
  } catch (err) { console.log(err); }

  if (!items.length) {
    return (
      <div style={{
        width: '100%',
        paddingBottom: '66%',
        background: 'rgba(114,0,0,0.05)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(0,0,0,0.15)', fontSize: 13, fontFamily: 'sans-serif'
        }}>
          нет фото
        </div>
      </div>
    );
  }

  const aspectRatio = CANVAS_H / CANVAS_W; 

  return (
    <div style={{ width: '100%', paddingBottom: `${aspectRatio * 100}%`, position: 'relative', overflow: 'hidden', background: '#fff' }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: CANVAS_W,
        height: CANVAS_H,
        // scale чтобы вписать в 100% ширины — используем CSS scale через transform
        transform: `scale(var(--preview-scale, 1))`,
        transformOrigin: 'top left',
        pointerEvents: 'none',
      }}
        ref={el => {
          if (!el) return;
          const parentW = el.parentElement?.offsetWidth || 1;
          const s = parentW / CANVAS_W;
          el.style.setProperty('--preview-scale', s);
          el.style.transform = `scale(${s})`;
        }}
      >
        {items.map((item, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: item.x, top: item.y,
            width: item.width, height: item.height,
            overflow: 'hidden',
            boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
          }}>
            <img
              src={item.url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default BoardPreview;