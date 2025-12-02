import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Table, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { db, auth } from '../../firebase';
import './gestionNoticiaPage.css'; // <--- El CSS se carga aquí
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import { logActivity } from '../../firebase/historialService';
import { useAuthState } from 'react-firebase-hooks/auth';

// Importación de Iconos e Imágenes (Mantenemos estas, pero eliminamos las variables de estilo)
import IconoPantallaV from '../../assets/Iconos/iconoPantallaVerde.png';
// ... (Iconos de Firebase, React Router, y Swal omitidos por brevedad, pero se mantienen en el código original)

function GestionNoticiasPage() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 🔑 Mantenemos la clave dura para la funcionalidad
    const API_KEY = '3cfd08bc2fdcf982ec047ca6d998187a'; 

    useEffect(() => {
        const fetchNews = async () => {
            const query = 'Tecnología OR Smartphones'; 
            const encodedQuery = encodeURIComponent(query);
            
            const url = `https://gnews.io/api/v4/search?q=${encodedQuery}&lang=es&max=9&apikey=${API_KEY}`;
            console.log("URL de GNews a probar:", url);

            try {
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.articles) {
                    setNews(data.articles);
                    console.log("Noticias cargadas de GNews:", data.articles.length);
                } else if (data.errors) {
                    console.error("Error de GNews API (revísalo en la consola):", data.errors);
                } else {
                    console.error("No se encontraron artículos o la respuesta de GNews fue inesperada.");
                }
            } catch (error) {
                console.error("Error al obtener noticias:", error);
            } finally {
                setLoading(false);
            }
        };

        if (API_KEY) {
            fetchNews();
        } else {
            console.error("La clave de GNews no está disponible.");
            setLoading(false);
        }
    }, [API_KEY]); 

    return ( 
        <>
        <NavBar /> 
        <div className="bg-gradient2">
            <div className="gestion-noticias-page">

                {/* 3. CONTENIDO PRINCIPAL (La sección de noticias) */}
            <main>
                <Container className="news-container mt-5 mb-5 p-4">
                    
                    {/* Título de la Sección: USAMOS CLASE CSS */}
                    <h2 className="section-title">
                        📰 Noticias y Tendencias del Sector
                    </h2>
                    <hr className="title-separator"/> {/* USAMOS CLASE CSS */}
                    
                    {loading ? (
                        <p className="loading-text">Cargando noticias...</p>
                    ) : (
                        <div className="row">
                            {news.length === 0 ? (
                                <div className="col-12 text-center py-5 no-news-message">
                                    No se encontraron noticias relevantes en este momento.
                                </div>
                            ) : (
                                news.map((article, index) => (
                                    <div key={index} className="col-lg-4 col-md-6 mb-4">
                                        <div 
                                            className=" news-card" // USAMOS CLASE CSS
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            {article.image && (
                                                <img 
                                                    src={article.image}
                                                    className="card-img-top card-image"
                                                    alt={article.title} 
                                                    
                                                  
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        // Ejemplo usando un placeholder genérico de dominio público (si no tienes una):
                                                        e.currentTarget.src = "https://via.placeholder.com/400x180?text=Imagen+No+Disponible";
                                                    }}
                                                />
                                            )}
                                            
                                            
                                            <div className="card-body d-flex flex-column">
                                                <h5 className="card-title fw-bold card-title-custom"> {/* USAMOS CLASE CSS */}
                                                    {article.title}
                                                </h5>
                                                <p className="card-text small mb-2 card-metadata"> {/* USAMOS CLASE CSS */}
                                                    {article.source.name} | {new Date(article.publishedAt).toLocaleDateString()}
                                                </p>
                                                <p className="card-text flex-grow-1 card-description"> {/* USAMOS CLASE CSS */}
                                                    {article.description?.substring(0, 100)}...
                                                </p>
                                                <hr />
                                                <a 
                                                    href={article.url} 
                                                    rel="noopener noreferrer" 
                                                    className="btn btn-sm fw-bold  align-self-start card-link-btn" // USAMOS CLASE CSS
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
            </div>
            

            {/* 4. FOOTER VISIBLE */}
           
        </div>
         <Footer />
        </>
    );
}

export default GestionNoticiasPage;