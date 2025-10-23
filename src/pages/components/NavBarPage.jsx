import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { FaSignOutAlt } from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import logo from '../../assets/logos/logoapp-daptable.jpeg';
import userDefault from '../../assets/logos/user.png'; 
import logoxiami from '../../assets/logos/logoxiami.png'; 
import logosamgsumg from '../../assets/logos/logosamgsumg.png'; 
import logohuawei from '../../assets/logos/logohuawei.png'; 
import logomotorola from '../../assets/logos/logomotorola.png';
import Swal from 'sweetalert2';

function NavBar() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);

  // Obtener la foto del usuario
  const userPhoto = user?.photoURL || userDefault;

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

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Vas a cerrar sesión.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'No, quedarme',
    });

    if (result.isConfirmed) {
      try {
        await signOut(auth);
        sessionStorage.setItem("logout", "true"); 
        Swal.fire({
          icon: 'success',
          title: 'Sesión cerrada',
          text: '¡Has cerrado sesión exitosamente!',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          navigate('/');
        });
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al cerrar sesión.',
        });
      }
    }
  };

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

                {/* Mostrar el menú "Personas" solo si el rol es ADMIN */}
                {userRole === 'admin' && (
                  <NavDropdown title="Personas" id="basic-nav-dropdown">
                    <NavDropdown.Item onClick={() => navigate('/TablaCel')}>
                      Clientes
                    </NavDropdown.Item>
                    <NavDropdown.Item onClick={() => navigate('/auxiliares')}>
                      Auxiliares
                    </NavDropdown.Item>
                  </NavDropdown>
                )}

                {/* Menú accesible por todos - pills con icono y label */}
                <Nav.Link onClick={() => navigate('/xiaomi')} className="pill-link">
                  <div className="pill">
                    <img src={logoxiami} alt="Xiaomi" className="pill-icon" />
                    <small>Xiaomi</small>
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
                    <small>Huawei</small>
                  </div>
                </Nav.Link>

                <Nav.Link onClick={() => navigate('/motorola')} className="pill-link">
                  <div className="pill">
                    <img src={logomotorola} alt="Motorola" className="pill-icon" />
                    <small>Motorola</small>
                  </div>
                </Nav.Link>

                <Nav.Link onClick={() => navigate('/otros')} className="pill-link">
                  <div className="pill">
                    <small>Otros..</small>
                  </div>
                </Nav.Link>

              </Nav>

              {/* caja de búsqueda */}
              <div className="search-wrapper ms-3">
                <input className="search-input" placeholder="Buscar..." />
              </div>
            </div>

            {/* brand a la derecha y logout */}
            <div className="d-flex align-items-center ms-auto">
              <Nav.Item className="logout-container me-3" onClick={handleLogout}>
                <Nav.Link className="logout-link d-flex align-items-center gap-2">
                  <FaSignOutAlt /> Cerrar Sesión
                  <img src={userPhoto} alt="Foto de usuario" className="user-photo-nav" />
                </Nav.Link>
              </Nav.Item>
              <div className="brand-right">
                <Navbar.Brand onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                  <img src={logo} alt="Logo" height="44" className="d-inline-block align-top brand-logo" />
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
                 
