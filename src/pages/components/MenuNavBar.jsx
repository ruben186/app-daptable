import { useEffect, useState, useRef } from 'react';
import menuIcon from '../../assets/Iconos/IconoMenu.png';

// Componente local: grupo expandible accesible
function ExpandableGroup({ title, id, children, drawerOpen }) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef(null);

  // cerrar el grupo si el drawer se cierra
  useEffect(() => {
    if (!drawerOpen) setExpanded(false);
  }, [drawerOpen]);

  return (
    <div id={`group-${id}`}>
      {/* usar clases existentes: personas-group-title / personas-drawer-item.group-title */}
      <button
        className={`personas-drawer-item ${expanded ? 'open' : ''}`}
        aria-expanded={expanded}
        aria-controls={`content-${id}`}
        onClick={() => setExpanded((s) => !s)}
      >
        {title}
        <span className={`chev ${expanded ? 'open' : ''}`} aria-hidden="true" />
      </button>

      <div
        id={`content-${id}`}
        ref={contentRef}
        role="region"
        aria-labelledby={`group-${id}`}
        style={{ display: expanded ? 'block' : 'none' }}
      >
        {children}
      </div>
    </div>
  );
}

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
        width="67px"
        height="47px"
        />
      </button>

      <div className={`personas-overlay ${open ? 'visible' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`personas-drawer ${open ? 'open' : ''}`} role="menu">
        <div className="personas-drawer-header">
          <img 
          src={menuIcon} 
          alt="ImgMenu" 
          width="67px"
          height="47px"
          className="drawer-close" 
          onClick={() => setOpen(false)}
          />
        </div>

        <div className="personas-drawer-list">
          {/* Top-level items */}
          <div className="espacios-menu" />
          <button className="personas-drawer-item" onClick={() => { navigate('/perfil'); setOpen(false); }}>
            Mi Perfil
          </button>
          <div className="espacios-menu" />
          <button className="personas-drawer-item" onClick={() => { navigate('/opinion'); setOpen(false); }}>
            Nos interesa tu opinión
          </button>
          <div className="espacios-menu" />
          <button className="personas-drawer-item" onClick={() => { navigate('/noticias'); setOpen(false); }}>
            Noticias
          </button>
          <div className="espacios-menu" />
          {/* Group: Aprende (expandable) */}
          <ExpandableGroup title="Aprende" id="aprende" drawerOpen={open}>
            <button className="personas-drawer-item"  onClick={() => { navigate('/aprende/paso'); setOpen(false); }}>
              Paso a paso(PDF)
            </button>
            <button className="personas-drawer-item"   onClick={() => { navigate('/aprende/shorts'); setOpen(false); }}>
              Shorts(Videos)
            </button>
          </ExpandableGroup>
            <div className="espacios-menu" />
          {/* Group: Ayúdanos (expandable) */}
          <ExpandableGroup title="Ayúdanos" id="ayudanos" className="personas-drawer-item" drawerOpen={open}>
            <button className="personas-drawer-item" onClick={() => { navigate('/ayuda/donaciones'); setOpen(false); }}>
              Donaciones
            </button>
            <button className="personas-drawer-item" onClick={() => { navigate('/ayuda/aumentar-bd'); setOpen(false); }}>
              Aumentar base de datos
            </button>
          </ExpandableGroup>

          {/* Admin quick links (original Personas options) */}
          <div className="espacios-menu" />
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