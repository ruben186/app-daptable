
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown, Carousel } from 'react-bootstrap';
import { FaSignOutAlt } from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import logo from '../../assets/logos/logoapp-daptable.jpeg';
import userDefault from '../../assets/logos/user.png'; 
import imagen1Ca from '../../assets/imagenes carrusel/xiMI 17PROMAX.jpeg';
import imagen2Ca from '../../assets/imagenes carrusel/XIAMI 17PRO,17PROMAX.jpeg';
import imagen3Ca from '../../assets/imagenes carrusel/17proxiami.png';
import './dashBoardPage.css';
import Swal from 'sweetalert2';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';

function DashboardPage() {
  const [user] = useAuthState(auth);
    
      // Determinar foto de usuario
      
      const userPhoto = user?.photoURL || userDefault;
    
      // Agregamos el console.log para verificar qué foto se está usando
      console.log(
        user?.photoURL
          ? `Usuario tiene foto: ${user.photoURL}`
          : `Usuario SIN foto, se usará: ${userDefault}`
      );
      
  return (
    <>
      <div className="page-offset">
        <NavBar/>
         
          <div className='mt-5'> 
            <div className="carousel-outer">
              <Carousel>
                <Carousel.Item>
                  <img 
                    src={imagen1Ca}
                    alt="imagen 1" 
                    loading='eager'
                  />
                </Carousel.Item>
                  <Carousel.Item>
                  <img 
                    src={imagen2Ca}
                    alt="imagen 2" 
                  />
                </Carousel.Item>
                  <Carousel.Item>
                  <img 
                    src={imagen3Ca}
                    alt="imagen 3" 
                  />
                </Carousel.Item>
              </Carousel>
            </div>
          </div>
            {/* CONTENIDO PRINCIPAL */}
            <main className="main-content">
                <div>
                  <h1 className="welcome-title">BIENVENIDO A APP-DAPTABLE</h1>
                  <p className="welcome-text">
                      Herramienta para agilizar el trabajo a la hora  de reparar tu celular
                      ¿Cansado/a de adivinar qué repuesto o accesorio es compatible con tu celular? 
                      ¡Nosotros tenemos la respuesta! En nuestra plataforma, encontrar la compatibilidad perfecta es rápido y sencillo.
                  </p>
                </div>
            </main>
          <Footer/>
      </div>
    </>
  );
}

export default DashboardPage;