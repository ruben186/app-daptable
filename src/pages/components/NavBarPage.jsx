import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { auth, db } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
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
  const [userRole, setUserRole] = useState(null);


  // Obtener rol desde Firestore
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const rol = userSnap.data().rol?.toLowerCase();
          setUserRole(rol);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  // Nota: la acción de logout está disponible en otro lugar; si se quiere activar aquí,
  // se puede reañadir la función handleLogout.

  return (
    <div>
      {/* NAVBAR */}
      <Navbar expand="lg" variant="dark" className="dashboard-navbar fixed-top">
        <Container className="navbarContainer">
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {/* contenedor de pills y búsqueda */}
            <div className="navbar-center d-flex align-items-center">
              <Nav className="pills-container d-flex align-items-center">
                  <div className="personas-wrapper" ref={null}>
                    <PersonasMenu navigate={navigate} />
                  </div>
            
                {/* Menú accesible por todos - pills con icono y label */}
                <Nav.Link onClick={() => navigate('/xiaomi')} className="pill-link">
                  <div className="pill">
                    <img src={logoxiami} alt="Xiaomi" className="pill-icon" width="45px" height="42px"/>
                  </div>
                </Nav.Link>

                <Nav.Link onClick={() => navigate('/samgsumg')} className="pill-link">
                  <div className="pill">
                    <img src={logosamgsumg} alt="Samsung" className="pill-icon" />
                  </div>
                </Nav.Link>

                <Nav.Link onClick={() => navigate('/huawei')} className="pill-link">
                  <div className="pill">
                    <img src={logohuawei} alt="Huawei" className="pill-icon" />
                  </div>
                </Nav.Link>

                <Nav.Link onClick={() => navigate('/motorola')} className="pill-link">
                  <div className="pill">
                    <img src={logomotorola} alt="Motorola" className="pill-icon" width="50px" height="50px"  />
                  </div>
                </Nav.Link>

                <NavDropdown
                  title={<div className="pill"><small>Otros..</small></div>}
                  id="nav-dropdown-otros"
                  className="pill-link nav-dropdown-pill"
                  renderMenuOnMount={true}
                >
                  <NavDropdown.Item onClick={() => navigate('/Oppo')} className="dropdown-item">
                    <div className="pill">
                      <img src={logoOppo} alt="Oppo" className="pill-icon" width="80px" height="80px" style={{borderRadius: '20px'}} />
                    </div>
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/Realme')} className="dropdown-item">
                    <div className="pill">
                      <img src={logoRealme} alt="Realme" className="pill-icon" width="100px" height="100px" style={{borderRadius: '20px'}} />
                    </div>
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/Vivo')} className="dropdown-item">
                    <div className="pill">
                      <img src={logoVivo} alt="Vivo" className="pill-icon" width="90px" height="90px" style={{borderRadius: '20px'}} />
                    </div>
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/ZTE')} className="dropdown-item">
                    <div className="pill">
                      <img src={logoZTE} alt="ZTE" className="pill-icon" width="60px" height="60px" />
                    </div>
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>

              {/* caja de búsqueda */}
              <div className="search-wrapper ms-3">
                <input className="search-input" placeholder="Buscar..." /><img src={IconoBuscar} className="ImgLupa" alt="iconoBusqueda" />
              </div>
            </div>

            {/* brand a la derecha y logout */}
            <div className="wrapper-logo">
              <div className="brand-right">
                <Navbar.Brand onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                  <img src={logo} alt="Logo" className="brand-logo" />
                </Navbar.Brand>
              </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
}

export default NavBar;
 


                 
