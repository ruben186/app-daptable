import { useEffect, useState, useRef } from 'react';
import menuIcon from '../../assets/Iconos/IconoMenu.png';

function PersonasMenu({ navigate }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Drawer lateral: muestra overlay y panel que se desliza desde la izquierda
  return (
    <div ref={wrapperRef}>
      <button
        className="personas-toggle"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((s) => !s)}
      >
        <img 
        src={menuIcon}
        alt="ImgMenu" 
        width="77px"
        height="57px"
        />
      </button>

      <div className={`personas-overlay ${open ? 'visible' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`personas-drawer ${open ? 'open' : ''}`} role="menu">
        <div className="personas-drawer-header">
          <button className="drawer-close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="personas-drawer-list">
          {/* Top-level items */}
          <button className="personas-drawer-item" onClick={() => { navigate('/perfil'); setOpen(false); }}>
            Mi Perfil
          </button>
          <button className="personas-drawer-item" onClick={() => { navigate('/opinion'); setOpen(false); }}>
            Nos interesa tu opinión
          </button>
          <button className="personas-drawer-item" onClick={() => { navigate('/noticias'); setOpen(false); }}>
            Noticias
          </button>

          {/* Group: Aprende */}
          <div className="personas-group-title">Aprende</div>
          <button className="personas-drawer-item" onClick={() => { navigate('/aprende/paso'); setOpen(false); }}>
            Paso a paso(PDF)
          </button>
          <button className="personas-drawer-item" onClick={() => { navigate('/aprende/shorts'); setOpen(false); }}>
            Shorts(Videos)
          </button>

          {/* Group: Ayúdanos */}
          <div className="personas-group-title">Ayúdanos</div>
          <button className="personas-drawer-item" onClick={() => { navigate('/ayuda/donaciones'); setOpen(false); }}>
            Donaciones
          </button>
          <button className="personas-drawer-item" onClick={() => { navigate('/ayuda/aumentar-bd'); setOpen(false); }}>
            Aumentar base de datos
          </button>

          {/* Admin quick links (original Personas options) */}
          <div style={{ height: 12 }} />
          <button className="personas-drawer-item" onClick={() => { navigate('/TablaCel'); setOpen(false); }}>
            Clientes (tabla)
          </button>
          <button className="personas-drawer-item" onClick={() => { navigate('/auxiliares'); setOpen(false); }}>
            Auxiliares (tabla)
          </button>
        </div>
      </aside>
    </div>
  );
}
export default PersonasMenu;