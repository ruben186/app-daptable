import React from 'react';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Container, ProgressBar } from 'react-bootstrap';
// En EstadisticaPage.jsx
import { fetchTopVistasGlobal } from '../../firebase/statsService';
import { handleCompatibilityCheck, getLogoUrlByMarca } from '../components/compatibilidades';
import { logActivity } from '../../firebase/historialService';
import IconoPantallaV from '../../assets/Iconos/iconoPantallaVerde.png';
import IconoBateriaV from '../../assets/Iconos/IconoBateriaV.png';
import IconoFlexBotonesV from '../../assets/Iconos/flexBotonesV.png';
import IconoflexcargaV from '../../assets/Iconos/flexdeCargaV.png'; 
import IconopuertocargaV from '../../assets/Iconos/pindecargaV.png'; 
import IconovidrioTV from '../../assets/Iconos/vidrioTV.png'; 
import IconovisorV from '../../assets/Iconos/visorV.png'; 
import IconoauricularV from '../../assets/Iconos/auricularV.png'; 
import IconoPiezaA from '../../assets/Iconos/IconoPiezaA.png'; 
import './EstadisticaPage.css';
import { db } from '../../firebase';
// import Swal from 'sweetalert2'; 
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase'; // Asegúrate de tener la ruta correcta a 'auth'
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
// Lista de piezas relevantes para el conteo de vistas
const PIEZA_ICONOS = {
    'PANTALLA': IconoPantallaV,
    'BATERIA': IconoBateriaV,
    'FLEX DE BOTONES': IconoFlexBotonesV,
    'FLEX BOTONES': IconoFlexBotonesV,
    'FLEX DE CARGA': IconoflexcargaV,
    'PIN DE CARGA': IconopuertocargaV,
    'PUERTO DE CARGA': IconopuertocargaV,
    'VIDRIO TEMPLADO': IconovidrioTV,
    'AURICULAR': IconoauricularV,
    'VISOR': IconovisorV,
    'MAS': IconoPiezaA,
    'OTRO': IconoPiezaA,
};

const EstadisticasPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    // Nuevo estado para manejar errores específicos de la colección 'historial'
    const [historialError, setHistorialError] = useState(null); 
     const [user] = useAuthState(auth);
      const [topVistas, setTopVistas] = useState([]); 
      const [loadingVistas, setLoadingVistas] = useState(true);
      const [selectedActivityId, setSelectedActivityId] = useState(null);
      const [modelos, setModelos] = useState([]);

    // Función para calcular el porcentaje
    const calculatePercentage = (count, total) => {
        if (total === 0) return '0%';
        return ((count / total) * 100).toFixed(1) + '%';
    };
    const getNumericPercentage = (percentString) => {
        return parseFloat(percentString.replace('%', ''));
    };
    useEffect(() => {
            const loadTopVistas = async () => {
                setLoadingVistas(true);
                const top = await fetchTopVistasGlobal(5);
                setTopVistas(top);
                setLoadingVistas(false);
            };
    
            const fetchModelos = async () => {
              try {
                  const snap = await getDocs(collection(db, 'tablas'));
                  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                  setModelos(data);
              } catch (e) {
                  console.error('No se pudieron cargar modelos (tablas):', e);
              }
            };
    
            fetchModelos();
            loadTopVistas();
        }, [user]);

    useEffect(() => {
        const fetchStatistics = async () => {
            setLoading(true);
            setHistorialError(null);
            
            // --- 1. Inicializar contadores y variables ---
            
            // Datos de Votos de Experiencia (EXPERIENCIA)
            let experienciaVotos = { EXCELENTE: 0, BUENA: 0, MALA: 0, total: 0 };
            
            // Datos de Vistas de Piezas (HISTORIAL)
            let piezasPopulares = [];
            
            // --- 2. Fetching Votos de Experiencia (Colección 'experiencia') ---
            try {
                const experienciaCollectionRef = collection(db, "experiencia");
                const snapshot = await getDocs(experienciaCollectionRef);
                snapshot.forEach((doc) => {
                    const opinion = doc.data().opinion;
                    if (opinion === 'EXCELENTE') experienciaVotos.EXCELENTE++;
                    else if (opinion === 'BUENA') experienciaVotos.BUENA++;
                    else if (opinion === 'MALA') experienciaVotos.MALA++;
                    experienciaVotos.total++;
                });
            } catch (err) {
                console.error("Error al cargar datos de experiencia:", err);
                // Si esta colección falla, al menos quedan los contadores en 0.
            }
                

            // --- 4. Establecer el Estado Final ---
            setStats({
                piezasPopulares: piezasPopulares,
                experienciaVotos: experienciaVotos,
            });

            setLoading(false);
        };

        fetchStatistics();
    }, []);

    // --- RENDERING ---
    if (loading) {
        return (
            <>
                <NavBar />
                <div className="opinion-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <h2 style={{ color: '#00d49f' }}>Cargando estadísticas...</h2>
                </div>
                <Footer />
            </>
        );
    }
    
        const handleActivityClick = (id) => {
            // Establece el ID de la actividad como seleccionada. 
            // Si haces clic en una actividad que ya está seleccionada, puedes deseleccionarla:
            setSelectedActivityId(id);
        };
    
        const handleHistoryClick = (historialItem) => {
            // En tu historial debes tener guardada la Marca, el Modelo y la Pieza
            const { Marca, Modelo, Pieza } = historialItem;
    
            // 1. Encontrar el objeto completo del modelo en la lista de `modelos`
            const userActual = modelos.find(m => 
                (m.modelo || '').toString().trim() === Modelo || (m.nombre || '').toString().trim() === Modelo
                // O busca por ID, si lo guardas en el historial
            );
    
            if (!userActual) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Modelo no encontrado',
                    text: `No se pudo encontrar la información completa del modelo: ${Modelo}.`
                });
                return;
            }
            // 2. Llamar a la función de utilidad
            handleCompatibilityCheck(Pieza, userActual, modelos, logActivity, user);
        };

    
    // Los cálculos para votos siempre se hacen porque experienciaVotos siempre tiene datos (cero o reales)
    const totalVotes = stats.experienciaVotos.total;
    const malaPercent = calculatePercentage(stats.experienciaVotos.MALA, totalVotes);
    const buenaPercent = calculatePercentage(stats.experienciaVotos.BUENA, totalVotes);
    const excelentePercent = calculatePercentage(stats.experienciaVotos.EXCELENTE, totalVotes);

    return (
        <>
            <NavBar />
            <div className='bg-gradient2'>
                <div className="estadisticas-container">
                    
                    <h1 style={{ color: '#00d49f', marginBottom: '40px', fontSize: '2em' }}>
                        📈 Indicadores y Estadísticas
                    </h1>

                    {/* --- SECCIÓN 1: PIEZA MÁS VISTA (Historial) --- */}
                    <Container className="my-5 container-topVistas">
                        <h2 className="text-center mb-4 pt-4">
                            Las Piezas Más Consultadas Globalmente
                        </h2>
                        
                        {loadingVistas ? (
                            <div className="text-center">
                                <div className="spinner-border text-info me-2" role="status"></div>
                                Cargando estadísticas...
                            </div>
                        ) : (
                            <div className="top-vistas-grid scroll-horizontal-on-overflow">
                                {topVistas.length > 0 ? (
                                    topVistas.map((pieza, index) => {
                                        const marcaLogoUrl = getLogoUrlByMarca(pieza.Marca);
                                        const isActive = pieza.id === selectedActivityId;
                                        // Lógica para determinar el icono de la pieza
                                        const piezaKey = pieza.Pieza?.toUpperCase();
                                        const piezaIcono = PIEZA_ICONOS[piezaKey] || PIEZA_ICONOS['OTRO']
                                        return(
                                        <div 
                                            key={pieza.id} 
                                            className={`actividad-item item-vistas ${isActive ? 'active' : ''}`}
                                            onClick={(e) => {
                                                handleHistoryClick(pieza);
                                                handleActivityClick(pieza.id);
                                            }}
                                        >
                                            <div className="actividad-item-superior vistas-superior">
                                                <img 
                                                src={piezaIcono} 
                                                loading="lazy"
                                                alt={pieza.Pieza || 'Pieza'} 
                                                className="icono-pieza-historial icono-vistas" 
                                                />
                                            </div>
                                            
                                            <div className="actividad-item-inferior vistas-inferior top-item-details">
                                                <strong className='text-center'>{pieza.Modelo || 'Modelo Desconocido'}</strong>
                                                <br />
                                                <span className="top-pieza-nombre">Pieza: {pieza.Pieza || 'N/A'}</span>
                                                <br />
                                                
                                                <div className="detalle-pieza-marca"> 
                                                    <span>Marca:</span>
                                                    {marcaLogoUrl && (
                                                        <img 
                                                        src={marcaLogoUrl} 
                                                        loading="lazy"
                                                        alt={pieza.Marca || 'Marca'}
                                                        className="logo-marca-historial" 
                                                        />
                                                    )}
                                                    <span>{pieza.Marca || 'Marca Desconocida'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                                ) : (
                                    <p className="text-center text-muted">Aún no hay suficientes datos de consulta.</p>
                                )}
                            </div>
                        )}
                        </Container>

                    <hr style={{ borderTop: '1px solid #123e3d', margin: '40px 0' }} />

                    {/* --- SECCIÓN 2: EXPERIENCIA DE USUARIO MÁS VOTADA (Experiencia) --- */}
                    <div className="stats-section">
                        <h2>⭐ Experiencia de Usuario Votada</h2>
                        <p style={{ color: '#c7d2d2', marginBottom: '20px' }}>
                            Distribución de las valoraciones de nuestros usuarios (Total: *{totalVotes} votos*).
                        </p>                    
                        <div className="vote-bar-container">
                            {/* Excelente */}
                            <div className="vote-bar-item">
                                <div className="vote-label" style={{ color: '#00d49f' }}>
                                    Excelente ({stats.experienciaVotos.EXCELENTE})
                                </div>
                                <div className="progress-bar-wrapper">
                                {/* USO DE PROGRESS BAR DE BOOTSTRAP: EXCELENTE */}
                                <ProgressBar 
                                    now={getNumericPercentage(excelentePercent)} 
                                    label={excelentePercent} 
                                    variant="success" 
                                    // Asegura que se vea bien en tu tema
                                    className="excellent-bar bar-carga" 
                                />
                                </div>
                            </div>

                            {/* Buena */}
                            <div className="vote-bar-item">
                                 <div className="vote-label" style={{ color: '#c7d2d2' }}>
                                  Buena ({stats.experienciaVotos.BUENA})
                                 </div>
                                 <div className="progress-bar-wrapper">
                                    {/* USO DE PROGRESS BAR DE BOOTSTRAP: BUENA */}
                                    <ProgressBar 
                                        now={getNumericPercentage(buenaPercent)} 
                                        label={buenaPercent} 
                                        // Usar una variante secundaria o de información para un color neutro/claro
                                        variant="info" 
                                        className="good-bar bar-carga"
                                    />
                                 </div>
                            </div>                  
                            {/* Mala */}
                            <div className="vote-bar-item">
                                <div className="vote-label" style={{ color: '#ff6b6b' }}>
                                    Mala ({stats.experienciaVotos.MALA})
                                </div>
                                <div className="progress-bar-wrapper">
                                     {/* USO DE PROGRESS BAR DE BOOTSTRAP: MALA */}
                                     <ProgressBar 
                                        now={getNumericPercentage(malaPercent)} 
                                        label={malaPercent} 
                                        variant="danger" 
                                        className="bad-bar bar-carga"
                                     />
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
               
            </div>
             <Footer />
        </>
    );
};

export default EstadisticasPage;