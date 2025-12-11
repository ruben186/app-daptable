import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { auth } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect, useState } from 'react';
import { useUserRole } from '../hooks/useUserRole';
import userDefault from '../../assets/logos/user.png'; 
import logoxiami from '../../assets/logos/logoxiami.png'; 
import logosamgsumg from '../../assets/logos/logosamgsumg.png'; 
import logohuawei from '../../assets/logos/logohuawei.png'; 
import logomotorola from '../../assets/logos/logomotorola.png';
import Menu from './MenuNavBar';
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';
import logoOppo from '../../assets/logos/OPPOLogo.png';
import logoRealme from '../../assets/logos/Realme_logo.png';
import logoVivo from '../../assets/logos/VivoLogo.png';
import logoZTE from '../../assets/logos/zteLogo.png';

function NavBar() {
  const navigate = useNavigate();
  const [user, authLoading] = useAuthState(auth);
  const location = useLocation();
  const { userRole, isRoleLoading } = useUserRole();
  const [activeBrand, setActiveBrand] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 992);
  const isAuthenticatedUser = userRole && userRole !== 'invitado';
  const isLoading = authLoading || isRoleLoading;

  // Determinar foto de usuario
  const userPhoto = user?.photoURL || userDefault;
  
  //Detectar cambio de tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 992);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sincronizar marca activa 
  useEffect(() => {
    const ps = new URLSearchParams(location.search);
    const b = ps.get('brand')?.toLowerCase() || null;
    setActiveBrand(b);
  }, [location.search]);

  // Manejar búsqueda
  const handleSearchSubmit = () => {
    const term = (searchValue || '').trim();
    const currentPath = location.pathname;
    const hasSearchQuery = location.search.includes('q=');

    if (!term) {
      if (hasSearchQuery) {
        // Navega a la ruta base
        navigate(currentPath, { replace: true });
      }
        
      // Limpiar el estado visual
      setSearchValue('');
      setActiveBrand(null);
      return; // Detiene la ejecución
    }

    // Marcas conocidas y aliases
    const brandAliases = {
      xiaomi: ['xiaomi', 'redmi'],
      samsung: ['samsung', 'samgsumg'],
      huawei: ['huawei'],
      motorola: ['motorola', 'moto'],
      oppo: ['oppo'],
      realme: ['realme'],
      vivo: ['vivo'],
      zte: ['zte']
    };
    
    // Detectar marca por aparición del nombre en la búsqueda
    const lower = term.toLowerCase();
    let detected = null;

    for (const [brand, aliases] of Object.entries(brandAliases)) {
      if (aliases.some(a => lower.includes(a))) {
        detected = brand;
        break;
      }
    }

    if (detected) {
      setActiveBrand(detected);
      navigate(`/xiaomi?brand=${encodeURIComponent(detected)}&q=${encodeURIComponent(term)}`);
    } else {
      // búsqueda genérica
      setActiveBrand(null);
      const currentPath = location.pathname;
      navigate(`/xiaomi?q=${encodeURIComponent(term)}`);
      const isLearningPath = currentPath.startsWith('/aprende');
      if (isLearningPath) {
        // Mantiene la ruta actual y solo añade el término de búsqueda
        navigate(`${currentPath}?q=${encodeURIComponent(term)}`);
      } else {
        // Si no estamos en una página de aprendizaje, va a la página de resultados principal
        navigate(`/xiaomi?q=${encodeURIComponent(term)}`);
      }
    }
  };

  return (
    <div>
      <Navbar className="dashboard-navbar fixed-top">
        <Container className="navbarContainer">
          <div className="menu-wrapper" ref={null}>
            <Menu navigate={navigate} setActiveBrand={setActiveBrand} showBrandsInDrawer={!isLargeScreen}/>
          </div>
          
            {/* contenedor de pills y búsqueda */}
          <div className="navbar-center d-flex align-items-center">
            <Nav className="pills-container d-none d-lg-flex align-items-center">
              {/* Menú accesible por todos - pills con icono y label */}
              <Nav.Link onClick={() => { navigate('/xiaomi?brand=xiaomi'); setActiveBrand('xiaomi'); }} className="pill-link">
                <div className={"pill" + (activeBrand === 'xiaomi' ? ' active' : '')}>
                  <img src={logoxiami} alt="Xiaomi" className="pill-icon" width="45px" height="42px"/>
                </div>
              </Nav.Link>

              <Nav.Link onClick={() => { navigate('/xiaomi?brand=samsung'); setActiveBrand('samsung'); }} className="pill-link">
                <div className={"pill" + (activeBrand === 'samsung' ? ' active' : '')}>
                  <img src={logosamgsumg} alt="Samsung" className="pill-icon" />
                </div>
              </Nav.Link>

              <Nav.Link onClick={() => { navigate('/xiaomi?brand=huawei'); setActiveBrand('huawei'); }} className="pill-link">
                <div className={"pill" + (activeBrand === 'huawei' ? ' active' : '')}>
                  <img src={logohuawei} alt="Huawei" className="pill-icon" />
                </div>
              </Nav.Link>

              <Nav.Link onClick={() => { navigate('/xiaomi?brand=motorola'); setActiveBrand('motorola'); }} className="pill-link">
                <div className={"pill" + (activeBrand === 'motorola' ? ' active' : '')}>
                  <img src={logomotorola} alt="Motorola" className="pill-icon" width="50px" height="50px"  />
                </div>
              </Nav.Link>

              <NavDropdown
                title={<div className="pill"><small>Otros..</small></div>}
                id="nav-dropdown-otros"
                className="pill-link nav-dropdown-pill"
                renderMenuOnMount={true}
              >
                <NavDropdown.Item onClick={() => { navigate('/xiaomi?brand=oppo'); setActiveBrand('oppo'); }} className="dropdown-item" >
                  <div className={"pill" + (activeBrand === 'oppo' ? ' active' : '')}>
                    <img src={logoOppo} alt="Oppo" className="pill-icon" width="80px" height="80px" />
                  </div>
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => { navigate('/xiaomi?brand=realme'); setActiveBrand('realme'); }} className="dropdown-item">
                  <div className={"pill" + (activeBrand === 'realme' ? ' active' : '')}>
                    <img src={logoRealme} alt="Realme" className="pill-icon" width="100px" height="100px" style={{borderRadius: '20px'}} />
                  </div>
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => { navigate('/xiaomi?brand=vivo'); setActiveBrand('vivo'); }} className="dropdown-item">
                  <div className={"pill" + (activeBrand === 'vivo' ? ' active' : '')}>
                    <img src={logoVivo} alt="Vivo" className="pill-icon" width="90px" height="90px" style={{borderRadius: '20px'}} />
                  </div>
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => { navigate('/xiaomi?brand=zte'); setActiveBrand('zte'); }} className="dropdown-item">
                  <div className={"pill" + (activeBrand === 'zte' ? ' active' : '')}>
                    <img src={logoZTE} alt="ZTE" className="pill-icon" width="60px" height="60px" />
                  </div>
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>

            {/* caja de búsqueda */}
            <div className="search-wrapper ms-3">
              <input
                className="search-input"
                placeholder="Buscar..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  }
                }}
              />
              <img src={IconoBuscar} className="ImgLupa" loading="lazy" alt="iconoBusqueda" style={{cursor:'pointer'}} onClick={() => handleSearchSubmit()} />
            </div>
          </div>

          {/* brand a la derecha y perfil o inicio de sesión */}
          <div className="brand-right">
            <Navbar.Brand 
              onClick={() => { 
                if (!isLoading) {
                navigate(isAuthenticatedUser ? '/perfil' : '/'); 
                }
              }}
              style={{ cursor: isLoading ? 'wait' : 'pointer' }}
            >
              {isLoading ? (
                // Nada se muestra mientras carga
                <div>
                </div>
                ) : (
                // Mostrar el contenido final
                isAuthenticatedUser ? 
                  <img src={userPhoto} alt="Foto de Perfil" className="brand-logo" /> 
                  : 
                  <button className="perfil-btn d-none d-lg-flex">Iniciar Sesión</button>
                )
              }
            </Navbar.Brand> 
          </div>
        </Container>
      </Navbar>
    </div>
  );
}

export default NavBar;