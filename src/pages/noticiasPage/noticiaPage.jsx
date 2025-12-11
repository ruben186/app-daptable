import { useEffect, useState } from 'react';
import { collection, getDocs,query} from 'firebase/firestore';
import { useNavigate} from 'react-router-dom';
import { Container} from 'react-bootstrap';
import { db } from '../../firebase';
import './noticiaPage.css';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import iconoNoticiasFal from '../../assets/Iconos/iconoNoticiasFal.png';

function NoticiasPage() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredVideos, setFilteredVideos] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNews = async () => {
            const query = 'tecnología OR Celulares OR reparacion celulares'; 
            const proxyUrl = `/api-proxy.php?q=${encodeURIComponent(query)}`;

            try {
                const response = await fetch(proxyUrl);
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
        fetchNews();
    }, []); 

    useEffect(() => {
        const fetchVideos = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'materialNoticias'));
            const snap = await getDocs(q);
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setFilteredVideos(items);
        } catch (err) {
            console.error('Error cargando videos:', err);
        } finally {
            setLoading(false);
        }
        };
        fetchVideos();
    }, []);

    const goToDetalle = (item) => {
        if (!item || !item.id) return;
        if(item.tipo === 'video'){
            navigate(`/aprende/video/${item.id}`);
        }else{
            window.open(item.url, '_blank')
        }
    };
    const DataCard = ({ item }) => {
        // Extraer posible thumbnail de YouTube (si es youtube) para mostrar en el área superior
        let thumbnail = null;
        try {
        const m = item.url && item.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_]+)/);
        if (m && m[1]) thumbnail = `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
        } catch (e) { /* ignore */ }

        return (
            <div  className=" news-card"  
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <div className="card-img-top card-image" alt={item.nombre}  style={{
                    backgroundImage: `url(${thumbnail || iconoNoticiasFal})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                    }} 
                />
                <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold card-title-custom"> 
                        {item.nombre}
                    </h5>
                    <p className="card-text small mb-2 card-metadata"> 
                        {item.fecha?.toDate ? new Date(item.fecha.toDate()).toLocaleDateString('es-ES') : ''}
                    </p>
                    <p className="card-text flex-grow-1 card-description"> 
                        {item.descripcion?.substring(0, 150)}...
                    </p>
                    <hr />
                    <a 
                        onClick={() => goToDetalle(item)}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-sm fw-bold  align-self-start card-link-btn"
                    >
                        Ver Fuente ➡️
                    </a>
                </div>
            </div>
        );
    };
    return ( 
        <>
            <NavBar /> 
            <div className="bg-gradient2 bg-noticias">
                <div className="gestion-noticias-page">
                    <main>
                        <Container className=" mt-5 mb-5 p-4">   
                            <h2 className="section-title">
                                📰 Noticias y Tendencias del Sector
                            </h2>
                            <hr className="title-separator"/> 
                            <div className="news-container">
                                <div className="row">
                                    {filteredVideos.length > 0 ? (
                                        filteredVideos.map(v => (
                                        <div  className="col-lg-4 col-md-6 mb-4">
                                        <DataCard item={v} />
                                        </div>
                                    ))
                                    ) : (
                                    !loading && (<p></p>)
                                    )}
                                </div> 
                            </div>
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
                                            <div key={index}  className="col-lg-4 col-md-6 mb-4">
                                                <div 
                                                    className=" news-card" 
                                                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                                >
                                                    {article.image && (
                                                        <img 
                                                            src={article.image}
                                                            loading="lazy"
                                                            className="card-img-top card-image"
                                                            alt={article.title} 
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = {iconoNoticiasFal};
                                                            }}
                                                        />
                                                    )}
                                                    
                                                    <div className="card-body d-flex flex-column">
                                                        <h5 className="card-title fw-bold card-title-custom"> 
                                                            {article.title}
                                                        </h5>
                                                        <p className="card-text small mb-2 card-metadata"> 
                                                            {article.source.name} | {new Date(article.publishedAt).toLocaleDateString()}
                                                        </p>
                                                        <p className="card-text flex-grow-1 card-description"> 
                                                            {article.description?.substring(0, 100)}...
                                                        </p>
                                                        <hr />
                                                        <a 
                                                            href={article.url} 
                                                            rel="noopener noreferrer" 
                                                            target="_blank" 
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
            </div>
            <Footer />
        </>
    );
}

export default NoticiasPage;