
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react'; 
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { db } from '../../firebase';
import Slider from 'react-slick';
import './dashBoardPage.css';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';

const getYoutubeThumbnail = (url) => {
  if (!url) return null;
  try {
    // Intenta extraer el ID del video
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_]+)/);
    if (match && match[1]) {
      // Retorna la URL del thumbnail de alta calidad
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
  } catch (e) {
    console.warn("Error al parsear URL de video:", url, e);
  }
  return null;
};

function DashboardPage() {
  const [featuredItems, setFeaturedItems] = useState([]);
  const navigate = useNavigate();
      
  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Obtener url de videos de noticias
        const q = query(collection(db, 'materialNoticias'), where('tipo', '==', 'video')); 
        const snap = await getDocs(q);
        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Solo mantener los ítems con miniatura válida
        const imageItems = items.map(item => {
          // Obtener la miniatura de la URL del video
          const thumbnailUrl = getYoutubeThumbnail(item.url);
          if (thumbnailUrl) {
            // Estructura necesaria para el carrusel
            return {
              id: item.id,
              title: item.nombre || 'Video sin título',
              imageUrl: thumbnailUrl,
              tipo: item.tipo,
              url: item.url
            };
          }
          return null;
        })
        .filter(Boolean); 
        // Limitar a 5 elementos
        setFeaturedItems(imageItems.slice(0, 5)); 
      } catch (err) {
        console.error('Error cargando items destacados:', err);
      }
    };
    fetchItems();
  }, []); 

  // Componente de Flecha Anterior
  const PrevArrow = ({ onClick }) => (
    <div 
      className="slick-prev-custom" 
      onClick={onClick} 
      style={{ zIndex: 10 }}
    >
      <FaChevronLeft className="arrow-icon left" />
    </div>
  );

  // Componente de Flecha Siguiente
  const NextArrow = ({ onClick }) => (
    <div 
      className="slick-next-custom" 
      onClick={onClick} 
      style={{ zIndex: 10 }} 
    >
      <FaChevronRight className="arrow-icon right" />
    </div>
  );

  // Configuracion del carrusel
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
          slidesToShow: 2, 
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  const goToDetalle = (item) => {
    if (!item || !item.id) return;
    navigate(`/aprende/video/${item.id}`);
  };

  return (
    <>
      <div className="page-offset">
        <NavBar/>
        {/* CARRUSEL */}
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