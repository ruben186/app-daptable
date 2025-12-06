
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown, Carousel } from 'react-bootstrap';
import { FaSignOutAlt } from 'react-icons/fa';
import React, { useEffect, useState } from 'react'; // <-- AGREGAR useEffect y useState
import { collection, getDocs, query, where } from 'firebase/firestore'; // <-- AGREGAR
import { db } from '../../firebase'; //
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


const getYoutubeThumbnail = (url) => {
  if (!url) return null;
  try {
    // Intenta extraer el ID del video
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_\-]+)/);
    
    if (match && match[1]) {
      // Retorna la URL del thumbnail de alta calidad (hqdefault)
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
  } catch (e) {
    console.warn("Error al parsear URL de video:", url, e);
  }
  return null;
};

function DashboardPage() {
  const [user] = useAuthState(auth);
  const [featuredItems, setFeaturedItems] = useState([]);
  const userPhoto = user?.photoURL || userDefault;

  // Agregamos el console.log para verificar qué foto se está usando
  console.log(
    user?.photoURL
      ? `Usuario tiene foto: ${user.photoURL}`
      : `Usuario SIN foto, se usará: ${userDefault}`
  );
      
  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Query para obtener los videos (asumiendo que son tus 'noticias')
        const q = query(collection(db, 'materialNoticias'), where('tipo', '==', 'video')); 
        const snap = await getDocs(q);
        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 1. PROCESAR Y FILTRAR: Solo mantener los ítems con miniatura válida
        const imageItems = items
          .map(item => {
            // Intenta obtener la miniatura de la URL del video
            const thumbnailUrl = getYoutubeThumbnail(item.url);
            
            if (thumbnailUrl) {
              // Si tiene miniatura, lo devolvemos con la estructura necesaria para el carrusel
              return {
                id: item.id,
                title: item.nombre || 'Video sin título',
                imageUrl: thumbnailUrl,
                linkUrl: item.url, // O el link de detalle si es diferente
              };
            }
            return null; // Si no hay miniatura, se descarta
          })
          .filter(Boolean); // Filtra todos los 'null' de la lista

        // 2. Limitar a 5 elementos (opcional, pero buena práctica para carruseles)
        setFeaturedItems(imageItems.slice(0, 5)); 

      } catch (err) {
        console.error('Error cargando items destacados:', err);
      }
    
    };
    fetchItems();
  }, []); // Se ejecuta solo al montar el componente

  
  return (
    <>
      <div className="page-offset">
        <NavBar/>
         
          <div className='mt-5'> 
            <div className="carousel-outer">
              <Carousel>
                {featuredItems.map((article) => (
                  <Carousel.Item key={article.id}>
                    {/* El enlace puede llevar a la noticia externa o a la página de detalle interna */}
                    <a 
                      href={article.linkUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      // O usa onClick si quieres la navegación interna: onClick={() => navigate(`/aprende/video/${article.id}`)}
                    >
                      <img 
                        src={article.imageUrl} 
                        alt={article.title} 
                        loading='eager'
                      />
                    </a>
                  </Carousel.Item>
                ))}
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