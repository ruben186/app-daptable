
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown, Carousel } from 'react-bootstrap';
import React, { useEffect, useState } from 'react'; // <-- AGREGAR useEffect y useState
import { collection, getDocs, query, where } from 'firebase/firestore'; // <-- AGREGAR
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { db } from '../../firebase'; //
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import Slider from 'react-slick';
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
  const navigate = useNavigate();

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
                tipo: item.tipo,
                url: item.url
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

  const PrevArrow = ({ onClick }) => (
    // La clase 'slick-prev-custom' tendrá el estilo de gradiente izquierdo
    <div 
        className="slick-prev-custom" 
        onClick={onClick} 
        style={{ zIndex: 10 }} // Asegura que esté por encima de las imágenes
    >
        <FaChevronLeft className="arrow-icon left" />
    </div>
);

// Componente de Flecha SIGUIENTE (NextArrow)
const NextArrow = ({ onClick }) => (
    // La clase 'slick-next-custom' tendrá el estilo de gradiente derecho
    <div 
        className="slick-next-custom" 
        onClick={onClick} 
        style={{ zIndex: 10 }} // Asegura que esté por encima de las imágenes
    >
        <FaChevronRight className="arrow-icon right" />
    </div>
);

  const sliderSettings = {
     dots: true,
     infinite: featuredItems.length > 3, 
     speed: 500,
     slidesToShow: 3, 
     slidesToScroll: 1,
     autoplay: true, 
     autoplaySpeed: 5000,
     centerMode: true,
     centerPadding: '0px',
     prevArrow: <PrevArrow />,
     nextArrow: <NextArrow />,
     cssEase: 'ease-in-out',
     customPaging: function(i) {
      return (
        <button>
          <span className="custom-slick-bar"></span>
        </button>
      );
    },

    // 2. Usa appendDots para mover el <ul> que contiene los dots
    appendDots: dots => (
      <div style={{
          position: 'absolute', 
          bottom: 0,  
          width: '100%',
          zIndex: 10, 
          textAlign: 'center'
        }}
      >
        <ul style={{ margin: "0px" }}> {dots} </ul>
      </div>
    ),
    
     responsive: [
       {
         breakpoint: 1024,
         settings: {
           slidesToShow: 2, // En tabletas, mostrar 2
           slidesToScroll: 1,
         }
       },
       {
         breakpoint: 600,
         settings: {
           slidesToShow: 1, // En móviles, mostrar 1
           slidesToScroll: 1
         }
       }
     ]
  };
  const goToDetalle = (item) => {
      if (!item || !item.id) return;
      if(item.tipo == 'video'){
          navigate(`/aprende/video/${item.id}`);
      }else{
          window.open(item.url, '_blank')
      }
  };
  return (
    <>
      <div className="page-offset">
        <NavBar/>
         
          <div className='mt-5'> 
            <div className="carousel-outer">
              {featuredItems.length > 0 ? (
               <Slider {...sliderSettings}>
                 {featuredItems.map((item) => (
                   <div key={item.id} className="slick-slide-item">
                     <a
                       onClick={() => goToDetalle(item)} 
                       rel="noopener noreferrer" 
                       style={{display: 'block' }}
                     >
                       <img 
                         src={item.imageUrl} 
                         alt={item.title} 
                         loading='eager'
                         // Aseguramos que la imagen ocupe el espacio del slide
                         style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                       />
                     </a>
                   </div>
                 ))}
               </Slider>
               ) : (
                 <p className="text-center welcome-text">Cargando videos destacados...</p>
               )}
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