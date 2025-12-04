import React from 'react';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Container, Button } from 'react-bootstrap';
// En EstadisticaPage.jsx

import { db } from '../../firebase';
// import Swal from 'sweetalert2'; 
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase'; // Asegúrate de tener la ruta correcta a 'auth'
import { logActivity } from '../../firebase/historialService';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
// Lista de piezas relevantes para el conteo de vistas
const RELEVANT_PIECES = [
    'pantalla', 'vidrio templado', 'bateria', 'visor', 
    'flex de carga', 'flex de botones', 'auricular', 'puerto de carga'
];

const EstadisticasPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    // Nuevo estado para manejar errores específicos de la colección 'historial'
    const [historialError, setHistorialError] = useState(null); 

    // Función para calcular el porcentaje
    const calculatePercentage = (count, total) => {
        if (total === 0) return '0%';
        return ((count / total) * 100).toFixed(1) + '%';
    };

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

            // --- 3. Fetching Vistas de Piezas (Colección 'historial') ---
            try {
                const historialCollectionRef = collection(db, "historial");
                const snapshot = await getDocs(historialCollectionRef);

                // Map para agregar vistas: Key = "pieza|marca|modelo"
                const viewsMap = new Map();

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const pieza = data.pieza ? data.pieza.toLowerCase() : '';
                    
                    // Solo contamos las vistas para las piezas relevantes
                    if (RELEVANT_PIECES.includes(pieza)) {
                        const modelo = data.modelo || 'Modelo Desconocido';
                        const marca = data.marca || 'Marca Genérica';
                        const key = `${pieza}|${marca}|${modelo}`;

                        const currentViews = viewsMap.get(key) || 0;
                        viewsMap.set(key, currentViews + 1);
                    }
                });

                // Convertir el Map a array y ordenarlo por vistas
                piezasPopulares = Array.from(viewsMap.entries())
                    .map(([key, vistas]) => {
                        const [pieza, marca, modelo] = key.split('|');
                        // Formato de nombre: "pantalla (Marca Modelo)"
                        return { nombre: `${pieza.charAt(0).toUpperCase() + pieza.slice(1)} (${marca} ${modelo})`, vistas };
                    })
                    .sort((a, b) => b.vistas - a.vistas); 

                // Si no hay documentos en la colección, mostramos un mensaje específico
                if (piezasPopulares.length === 0 && snapshot.docs.length > 0) {
                     setHistorialError("No se encontraron vistas para las piezas relevantes.");
                } else if (snapshot.docs.length === 0) {
                     setHistorialError("La colección 'historial' está vacía.");
                }

            } catch (err) {
                // 🚨 Caso requerido: Si la colección 'historial' no se encuentra,
                // solo se muestra el resultado de la experiencia (que ya se cargó/calculó).
                setHistorialError("Error al cargar datos del historial de piezas. Se mostrarán solo los datos de experiencia.");
                console.error("Error al cargar datos de historial:", err);
                // piezasPopulares queda como un array vacío [].
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
    
    // Los cálculos para votos siempre se hacen porque experienciaVotos siempre tiene datos (cero o reales)
    const totalVotes = stats.experienciaVotos.total;
    const malaPercent = calculatePercentage(stats.experienciaVotos.MALA, totalVotes);
    const buenaPercent = calculatePercentage(stats.experienciaVotos.BUENA, totalVotes);
    const excelentePercent = calculatePercentage(stats.experienciaVotos.EXCELENTE, totalVotes);

    return (
        <>
            <NavBar />
            
            <div className="opinion-container">
                
                <h1 style={{ color: '#00d49f', marginBottom: '40px', fontSize: '2em' }}>
                    📈 Indicadores y Estadísticas
                </h1>

                {/* --- SECCIÓN 1: PIEZA MÁS VISTA (Historial) --- */}
                <div className="stats-section">
                    <h2>🥇 Piezas de Celular Más Vistas</h2>
                    
                    {/* Condición de Renderizado */}
                    {stats.piezasPopulares.length > 0 ? (
                        <>
                            <p style={{ color: '#c7d2d2', marginBottom: '20px' }}>
                                Vistas de piezas por Marca y Modelo.
                            </p>
                            {stats.piezasPopulares.map((item, index) => (
                                <div key={index} className="stat-item">
                                    <span className="stat-rank">{index + 1}.</span>
                                    <span className="stat-name">**{item.nombre}**</span>
                                    <span className="stat-views">{item.vistas.toLocaleString()} vistas</span>
                                </div>
                            ))}
                        </>
                    ) : (
                         <p style={{ color: historialError ? '#ff6b6b' : '#c7d2d2', fontStyle: 'italic' }}>
                            {historialError || "No hay datos de vistas disponibles en la colección 'historial'."}
                        </p>
                    )}
                </div>

                <hr style={{ borderTop: '1px solid #123e3d', margin: '40px 0' }} />

                {/* --- SECCIÓN 2: EXPERIENCIA DE USUARIO MÁS VOTADA (Experiencia) --- */}
                <div className="stats-section">
                    <h2>⭐ Experiencia de Usuario Votada</h2>
                    <p style={{ color: '#c7d2d2', marginBottom: '20px' }}>
                        Distribución de las valoraciones de nuestros usuarios (Total: **{totalVotes} votos**).
                    </p>

                    <div className="vote-bar-container">
                        {/* Excelente */}
                        <div className="vote-bar-item">
                            <div className="vote-label" style={{ color: '#00d49f' }}>Excelente ({stats.experienciaVotos.EXCELENTE})</div>
                            <div className="progress-bar-wrapper">
                                <div 
                                    className="progress-bar excellent" 
                                    style={{ width: excelentePercent }}
                                >
                                    {excelentePercent}
                                </div>
                            </div>
                        </div>
                        {/* ... (Buena y Mala siguen el mismo patrón de renderizado) ... */}
                        <div className="vote-bar-item">
                            <div className="vote-label" style={{ color: '#c7d2d2' }}>Buena ({stats.experienciaVotos.BUENA})</div>
                            <div className="progress-bar-wrapper">
                                <div 
                                    className="progress-bar good" 
                                    style={{ width: buenaPercent }}
                                >
                                    {buenaPercent}
                                </div>
                            </div>
                        </div>

                        <div className="vote-bar-item">
                            <div className="vote-label" style={{ color: '#ff6b6b' }}>Mala ({stats.experienciaVotos.MALA})</div>
                            <div className="progress-bar-wrapper">
                                <div 
                                    className="progress-bar bad" 
                                    style={{ width: malaPercent }}
                                >
                                    {malaPercent}
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