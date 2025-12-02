import { useEffect, useState, useRef } from 'react';
import menuIcon from '../../assets/Iconos/IconoMenu.png';
import { useUserRole } from '../hooks/useUserRole';
import logoxiami from '../../assets/logos/logoxiami.png'; 
import logosamgsumg from '../../assets/logos/logosamgsumg.png'; 
import logohuawei from '../../assets/logos/logohuawei.png'; 
import logomotorola from '../../assets/logos/logomotorola.png';
import logoOppo from '../../assets/logos/OPPOLogo.png';
import logoRealme from '../../assets/logos/Realme_logo.png';
import logoVivo from '../../assets/logos/VivoLogo.png';
import logoZTE from '../../assets/logos/zteLogo.png';

const MarcaItem = ({ logoSrc, brand, navigate, setActiveBrand, setOpen }) => (
    <button 
        className="personas-drawer-item brand-item"
        onClick={() => {
            navigate(`/xiaomi?brand=${brand}`);
            setActiveBrand(brand); // Actualiza el estado en el NavBar principal
            setOpen(false); // Cierra el menú lateral
        }}
    >
        {/* Usamos una clase específica para el logo en el drawer */}
        <img src={logoSrc} alt={brand} className="drawer-brand-icon" /> 
        {brand.charAt(0).toUpperCase() + brand.slice(1)} {/* Muestra el nombre */}
    </button>
);

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
        <span className={`chevM ${expanded ? 'open' : ''}`} aria-hidden="true" />
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

function MenuNavbar({ navigate, setActiveBrand, showBrandsInDrawer }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { userRole, isRoleLoading } = useUserRole();

  const isAuthenticatedUser = userRole && userRole !== 'invitado';

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
          {showBrandsInDrawer && (
                <>
                  <ExpandableGroup title="Marcas" id="marcas" drawerOpen={open}>
                      {/* ... todos tus MarcaItem ... */}
                      <MarcaItem logoSrc={logoxiami} brand="xiaomi" navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                      <MarcaItem logoSrc={logosamgsumg} brand="samsung" navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                      <MarcaItem logoSrc={logohuawei} brand="huawei" navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                      <MarcaItem logoSrc={logomotorola} brand="motorola" navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                      <MarcaItem logoSrc={logoOppo} brand="oppo" navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                      <MarcaItem logoSrc={logoRealme} brand="realme" navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                      <MarcaItem logoSrc={logoVivo} brand="vivo" navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                      <MarcaItem logoSrc={logoZTE} brand="zte" navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                  </ExpandableGroup>
                </>
            )}

         <button 
             className="personas-drawer-item" 
            onClick={() => { 
                navigate(isAuthenticatedUser ? '/perfil' : '/'); 
                setOpen(false); 
             }}
          >
             {isAuthenticatedUser? 'Mi Perfil' : 'Iniciar Sesión'}
          </button>
         
          
          
          {(userRole === 'admin' || userRole === 'usuario') && (
            <>
            <button className="personas-drawer-item" onClick={() => { navigate('/opinion'); setOpen(false); }}>
            Nos interesa tu opinión
            </button>
            </>
          )}

          <button className="personas-drawer-item" onClick={() => { navigate('/NoticiaPage'); setOpen(false); }}>
            Noticias
          </button>
       
          {/* Group: Aprende (expandable) */}
          <ExpandableGroup title="Aprende" id="aprende" drawerOpen={open}>
            <button className="personas-drawer-item"  onClick={() => { navigate('/aprende/pdfs'); setOpen(false); }}>
              Paso a paso (PDF)
            </button>
            <button className="personas-drawer-item"   onClick={() => { navigate('/aprende/videos'); setOpen(false); }}>
              Shorts (Videos)
            </button>
          </ExpandableGroup>
  
          {/* Group: Ayúdanos (expandable) */}
          {(userRole === 'admin' || userRole === 'usuario') &&(
            <>
            <ExpandableGroup title="Ayúdanos" id="ayudanos" className="personas-drawer-item" drawerOpen={open}>
            <button className="personas-drawer-item" onClick={() => { navigate('/ayuda/donaciones'); setOpen(false); }}>
              Donaciones
            </button>
            <button className="personas-drawer-item" onClick={() => { navigate('/sugerirPieza'); setOpen(false); }}>
              Aumentar base de datos
            </button>
          </ExpandableGroup>
            </>
          )}
          

          {/* Admin quick links (original Personas options) */}
          {userRole === 'admin' && (
            <>
            <button className="personas-drawer-item" onClick={() => { navigate('/gestionAdmin'); setOpen(false); }}>
              Gestión de Administrador
            </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
export default MenuNavbar;