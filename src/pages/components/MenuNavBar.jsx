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
    className="menu-drawer-item brand-item"
    onClick={() => {
      navigate(`/xiaomi?brand=${brand}`);
      setActiveBrand(brand); // Actualiza el estado en el NavBar principal
      setOpen(false); // Cierra el menú lateral
    }}
  >
    {/* Clase específica para el logo en el drawer */}
    <img src={logoSrc} alt={brand} className="drawer-brand-icon" /> 
    {brand.charAt(0).toUpperCase() + brand.slice(1)} 
  </button>
);

// grupo expandible accesible
function ExpandableGroup({ title, id, children, drawerOpen }) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef(null);

  // cerrar el grupo si el drawer se cierra
  useEffect(() => {
    if (!drawerOpen) setExpanded(false);
  }, [drawerOpen]);

  return (
    <div id={`group-${id}`}>
      <button
        className={`menu-drawer-item ${expanded ? 'open' : ''}`}
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
  

  // Muestra overlay y panel que se desliza desde la izquierda
  return (
    <div ref={wrapperRef}>
      <button
        className="menu-toggle"
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

      <div className={`menu-overlay ${open ? 'visible' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`menu-drawer ${open ? 'open' : ''}`} role="menu">
        <div className="menu-drawer-header">
          <img 
          src={menuIcon} 
          alt="ImgMenu" 
          width="67px"
          height="47px"
          className="drawer-close" 
          onClick={() => setOpen(false)}
          />
        </div>

        <div className="menu-drawer-list">
          {isRoleLoading ? (
            <div className='welcome-text' style={{marginTop: '22px'}}>
              Cargando Opciones...
            </div>
          ) : (
          <> 
            <button 
              className="menu-drawer-item" 
              onClick={() => { navigate('/dashboard');}}
            >
              Inicio
            </button>

            {showBrandsInDrawer && (
              <>
                {(userRole === 'invitado') && (
                  <button 
                    className="menu-drawer-item" 
                    onClick={() => { navigate('/');}}
                  >
                    Iniciar Sesión
                  </button>
                )}
                <ExpandableGroup title="Marcas" id="marcas" drawerOpen={open}>
                  <MarcaItem logoSrc={logoxiami} brand="xiaomi" className='menu-marca' navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                  <MarcaItem logoSrc={logosamgsumg} brand="samsung" className='menu-marca' navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                  <MarcaItem logoSrc={logohuawei} brand="huawei" className='menu-marca' navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                  <MarcaItem logoSrc={logomotorola} brand="motorola" className='menu-marca' navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                  <MarcaItem logoSrc={logoOppo} brand="oppo" className='menu-marca' navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                  <MarcaItem logoSrc={logoRealme} brand="realme" className='menu-marca' navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                  <MarcaItem logoSrc={logoVivo} brand="vivo" className='menu-marca' navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                  <MarcaItem logoSrc={logoZTE} brand="zte" className='menu-marca' navigate={navigate} setActiveBrand={setActiveBrand} setOpen={setOpen} />
                </ExpandableGroup>
              </>
            )}

            {(userRole === 'admin' || userRole === 'usuario') && (
              <>
                <button className="menu-drawer-item" onClick={() => { navigate('/OpinionPage'); setOpen(false); }}>
                  Nos interesa tu opinión
                </button>
              </>
            )}

            <button className="menu-drawer-item" onClick={() => { navigate('/NoticiaPage'); setOpen(false); }}>
              Noticias
            </button>
        
            {/*Aprende Expandable*/}
            <ExpandableGroup title="Aprende" id="aprende" drawerOpen={open}>
              <button className="menu-drawer-item"  onClick={() => { navigate('/aprende/pdfs'); setOpen(false); }}>
                Paso a paso (PDF)
              </button>
              <button className="menu-drawer-item"   onClick={() => { navigate('/aprende/videos'); setOpen(false); }}>
                Shorts (Videos)
              </button>
            </ExpandableGroup>
    
            {/* Ayúdanos Expandable */}
            {(userRole === 'admin' || userRole === 'usuario') &&(
              <>
                <ExpandableGroup title="Ayúdanos" id="ayudanos" className="menu-drawer-item" drawerOpen={open}>
                  <button className="menu-drawer-item" onClick={() => { navigate('/sugerirPieza'); setOpen(false); }}>
                    Aumentar base de datos
                  </button>
                </ExpandableGroup>
              </>
            )}
            

            {/* Botones de Admin */}
            {userRole === 'admin' && (
              <>
                <button className="menu-drawer-item" onClick={() => { navigate('/gestionAdmin'); setOpen(false); }}>
                  Gestión de Administrador
                </button>
                <button className="menu-drawer-item" onClick={() => { navigate('/EstadisticaPage'); setOpen(false); }}>
                  Indiadores
                </button>
              </>
            )}          
          </> )}
        </div>
      </aside>
    </div>
  );
}

export default MenuNavbar;