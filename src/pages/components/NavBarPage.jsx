import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
// ...existing code...
import Swal from 'sweetalert2';
import { useEffect, useState } from 'react';
import logo from '../../assets/logos/logoapp-daptable.jpeg';
import logoxiami from '../../assets/logos/logoxiami.png'; 
import logosamgsumg from '../../assets/logos/logosamgsumg.png'; 
import logohuawei from '../../assets/logos/logohuawei.png'; 
import logomotorola from '../../assets/logos/logomotorola.png';
import PersonasMenu from './MenuNavBar';
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';
import logoOppo from '../../assets/logos/OPPOLogo.png';
import logoRealme from '../../assets/logos/Realme_logo.png';
import logoVivo from '../../assets/logos/VivoLogo.png';
import logoZTE from '../../assets/logos/zteLogo.png';

// SweetAlert se usa en otras partes; eliminado aquí para evitar warnings si no se usa.

function NavBar() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const location = useLocation();
  const [activeBrand, setActiveBrand] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 992);
  


  // Obtener rol desde Firestore
    useEffect(() => {
        const handleResize = () => {
            // Actualiza el estado basado en el breakpoint lg (992px)
            setIsLargeScreen(window.innerWidth >= 992);
        };

        window.addEventListener('resize', handleResize);
        
        // Limpieza: importante para evitar fugas de memoria
        return () => window.removeEventListener('resize', handleResize);
    }, []);

  // Sincronizar marca activa con la query string
  useEffect(() => {
    const ps = new URLSearchParams(location.search);
    const b = ps.get('brand')?.toLowerCase() || null;
    setActiveBrand(b);
  }, [location.search]);

  // Manejar búsqueda desde el navbar
  const handleSearchSubmit = () => {
    const term = (searchValue || '').trim();
    const currentPath = location.pathname;
    const hasSearchQuery = location.search.includes('q=');
    if (!term) {
        // Solo navegamos si hay un query string que necesitamos eliminar
        if (hasSearchQuery) {
            // Navega a la ruta base sin ningún query, forzando la limpieza.
            navigate(currentPath, { replace: true });
        }
        
        // Limpiar el estado visual, sin importar si navegamos o no.
        setSearchValue('');
      setActiveBrand(null);
      return; // Detiene la ejecución
    }

    const lower = term.toLowerCase();
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

    // Detectar marca por aparición del nombre en el término de búsqueda
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
      // búsqueda genérica sin marca
      setActiveBrand(null);
      const currentPath = location.pathname;
      navigate(`/xiaomi?q=${encodeURIComponent(term)}`);
      const isLearningPath = currentPath.startsWith('/aprende');
      if (isLearningPath) {
         // Mantiene la ruta actual y solo añade el término de búsqueda (ej: /aprende/videos?q=nuevo)
         navigate(`${currentPath}?q=${encodeURIComponent(term)}`);
      } else {
       // Si no estamos en una página de aprendizaje, va a la página de resultados principal
       navigate(`/xiaomi?q=${encodeURIComponent(term)}`);
    }
  }
  };

  const handleLogout = async () => {
          // Ejecuta la lógica de cierre de sesión SÓLO si el usuario confirmó
          try {
              await signOut(auth);
              navigate('/');
              console.log("Sesión cerrada exitosamente.");
          } catch (error) {
              console.error("Error al cerrar sesión:", error);
              // Opcional: Mostrar un error con Swal si falla el cierre de sesión
              Swal.fire('Error', 'No se pudo cerrar la sesión. Inténtalo de nuevo.', 'error');
          }
      };
  
      // 2. Nueva función que muestra la advertencia de SweetAlert
      const confirmLogout = () => {
          Swal.fire({
              title: '¿Estás seguro?',
              text: "¿Realmente quieres cerrar tu sesión actual?",
              icon: 'warning',
              background: '#052b27ff', // Color de fondo personalizado
              color: '#ffff', // Color del texto personalizado
              showCancelButton: true, // Muestra el botón de "Cancelar"
              confirmButtonColor: '#07433E', // Color del botón de confirmación
              cancelButtonColor: 'rgba(197, 81, 35, 1)', // Color del botón de cancelar
              confirmButtonText: 'Sí, cerrar sesión', // Texto del botón de confirmación
              cancelButtonText: 'Cancelar'
          }).then((result) => {
              // SweetAlert devuelve un objeto `result`
              if (result.isConfirmed) {
                  // Si el usuario hace clic en "Sí, cerrar sesión", llamamos a la función
                  handleLogout();
              }
          });
      };

  return (
    <div>
      {/* NAVBAR */}
      <Navbar className="dashboard-navbar fixed-top">
        <Container className="navbarContainer">
          <div className="personas-wrapper" ref={null}>
            <PersonasMenu navigate={navigate} setActiveBrand={setActiveBrand} showBrandsInDrawer={!isLargeScreen}/>
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
                <img src={IconoBuscar} className="ImgLupa" alt="iconoBusqueda" style={{cursor:'pointer'}} onClick={() => handleSearchSubmit()} />
              </div>
            </div>

            {/* brand a la derecha y logout */}
            
            <div className="brand-right">
              <button className="logout-btn d-none d-lg-block" onClick={confirmLogout}>Cerrar Sesión</button>
              <Navbar.Brand onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                <img src={logo} alt="Logo" className="brand-logo" />
              </Navbar.Brand> 
            </div>
           
         
        </Container>
      </Navbar>
    </div>
  );
}

export default NavBar;