import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Table, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { db, auth } from '../../firebase';
import './gestionNoticiaPage.css';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import { logActivity } from '../../firebase/historialService';
import { useAuthState } from 'react-firebase-hooks/auth';

// Importación de Iconos e Imágenes
import IconoPantallaV from '../../assets/Iconos/iconoPantallaVerde.png';
import IconoPantallaR from '../../assets/Iconos/iconoPantallaRojo.png';
import IconoBateriaR from '../../assets/Iconos/IconoBateriaR3.png';
import IconoBateriaV from '../../assets/Iconos/IconoBateriaV.png';
import IconoFlexBotonesV from '../../assets/Iconos/flexBotonesV.png';
import IconoFlexBotonesR from '../../assets/Iconos/flexBotonesR.png';
import IconoPiezaA from '../../assets/Iconos/IconoPiezaA.png';

// --- VARIABLES DE ESTILO PARA EL TEMA OSCURO ---
// Se definen los colores para asegurar consistencia en todo el componente
const PRIMARY_GREEN = '#00FF00'; // Verde brillante para titulares y elementos clave
const DARK_CARD_BG = '#1A1A1A'; // Fondo muy oscuro para las tarjetas (un poco más claro que el fondo de la app)
const LIGHT_TEXT = '#D0D0D0';     // Color claro para metadatos y descripciones
const CARD_BORDER_COLOR = `${PRIMARY_GREEN}44`; // Borde sutil verde transparente
function GestionNoticiasPage() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_KEY = process.env.REACT_APP_NEWS_API_KEY;
useEffect(() => {
        const fetchNews = async () => {
            const query = 'reparacion de celulares OR tecnologia movil OR mercado smartphone OR samsung OR iphone'; 
            const url = `https://newsapi.org/v2/everything?q=${query}&apiKey=${API_KEY}&language=es&sortBy=publishedAt`;
            console.log("URL de la API a probar:", url);
            try {
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.status === "ok" && data.articles) {
                    setNews(data.articles.slice(0, 9)); 
                    console.log(data.articles.slice(0, 9));
                } else {
                     console.error("Error de NewsAPI o no se encontraron artículos.");
                }
            } catch (error) {
                console.error("Error al obtener noticias:", error);
            } finally {
                setLoading(false);
            }
        };
        console.log("Valor de la API Key:", API_KEY);

        if (API_KEY && API_KEY !== 'TU_API_KEY_AQUI') {
             fetchNews();
        } else {
             setLoading(false);
        }
    }, [API_KEY]); 

    

    return (
        // 1. Contenedor principal para toda la página
        <div className="gestion-noticias-page" style={{ minHeight: '100vh', backgroundColor: '#000000' }}>
            
            {/* 2. NAV BAR VISIBLE */}
            <NavBar /> 

            {/* 3. CONTENIDO PRINCIPAL (La sección de noticias) */}
            <main>
                <Container className="news-container mt-5 mb-5 p-4">
                    
                    {/* Título de la Sección: Verde brillante */}
                    <h2 style={{ color: PRIMARY_GREEN, marginBottom: '20px' }}>
                        📰 Noticias y Tendencias del Sector
                    </h2>
                    <hr style={{ borderColor: PRIMARY_GREEN, opacity: 0.5 }}/>
                    
                    {loading ? (
                        <p style={{ color: LIGHT_TEXT, textAlign: 'center' }}>Cargando noticias...</p>
                    ) : (
                        <div className="row">
                            {news.length === 0 ? (
                                <div className="col-12 text-center py-5" style={{ color: LIGHT_TEXT }}>
                                    No se encontraron noticias relevantes en este momento.
                                </div>
                            ) : (
                                news.map((article, index) => (
                                    <div key={index} className="col-lg-4 col-md-6 mb-4">
                                        <div 
                                            className="card h-100 shadow-lg" 
                                            style={{ 
                                                backgroundColor: DARK_CARD_BG, 
                                                border: `1px solid ${CARD_BORDER_COLOR}`,
                                                borderRadius: '8px',
                                                transition: 'transform 0.2s',
                                                cursor: 'pointer'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            {article.urlToImage && (
                                                <img 
                                                    src={article.urlToImage} 
                                                    className="card-img-top" 
                                                    alt={article.title} 
                                                    style={{ height: '180px', objectFit: 'cover', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
                                                />
                                            )}
                                            
                                            <div className="card-body d-flex flex-column">
                                                <h5 className="card-title fw-bold" style={{ color: PRIMARY_GREEN, fontSize: '1.1em' }}>
                                                    {article.title}
                                                </h5>
                                                <p className="card-text small mb-2" style={{ color: LIGHT_TEXT, opacity: 0.7 }}>
                                                    {article.source.name} | {new Date(article.publishedAt).toLocaleDateString()}
                                                </p>
                                                <p className="card-text flex-grow-1" style={{ color: LIGHT_TEXT }}>
                                                    {article.description?.substring(0, 100)}...
                                                </p>
                                                <a 
                                                    href={article.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="btn btn-sm fw-bold mt-3 align-self-start"
                                                    style={{ 
                                                        backgroundColor: PRIMARY_GREEN, 
                                                        color: 'black', 
                                                        border: 'none',
                                                        padding: '5px 15px' 
                                                    }}
                                                >
                                                    Ver Fuente ➡️
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </Container>
            </main>

            {/* 4. FOOTER VISIBLE */}
            <Footer />
        </div>
    );
}

export default GestionNoticiasPage;