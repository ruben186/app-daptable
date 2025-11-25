import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
// import Swal from 'sweetalert2'; 
import { db } from '../../firebase'; // Asegúrate de que la ruta sea correcta
import './xiaomi.css'; 
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';

// Importación de Iconos e Imágenes
import IconologoXiami from '../../assets/logos/logoxiaomiverde2.png';
import IconoPantallaV from '../../assets/Iconos/iconoPantallaVerde.png';
import IconoBateriaV from '../../assets/Iconos/IconoBateriaV.png';
import IconoFlexBotonesV from '../../assets/Iconos/flexBotonesV.png';
import IconoPiezaA from '../../assets/Iconos/IconoPiezaA.png'; 
import IconoflexcargaV from '../../assets/Iconos/flexdeCargaV.png'; 
import IconoflexcargaR from '../../assets/Iconos/flexCargaR.png'; 
import IconopuertocargaV from '../../assets/Iconos/pindecargaV.png'; 
import IconovidrioTV from '../../assets/Iconos/vidrioTV.png'; 
import IconovidrioTR from '../../assets/Iconos/vidrioTR.png'; 
import IconovisorV from '../../assets/Iconos/visorV.png'; 
// --- LISTA DE RESPALDO (GARANTIZA LA VISIBILIDAD DE LAS 10 CARDS) ---
// Si Firebase no devuelve datos, esta lista se usa para que las tarjetas siempre estén visibles.
const DEFAULT_PARTES = [
    { id: 'def1', name: "puerto de carga" },
    { id: 'def2', name: "Bateria" },
    { id: 'def3', name: "Pantalla" },
    { id: 'def4', name: "Flex de carga" },

    { id: 'def6', name: "Flex de Botones" },
    { id: 'def7', name: "Vidrio templado" },
    { id: 'def8', name: "Visor" },
   
];

function BtnMasXiaomi() {
    const navigate = useNavigate();

    // Estados
    const [partes, setPartes] = useState([]);
    const [selectedPartId, setSelectedPartId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar datos de Firebase o la lista por defecto
    useEffect(() => {
        const obtenerPartes = async () => {
            let fetchedParts = [];
            try {
                // Intenta obtener datos de la colección 'repuestos_redmi'
                const partesCollectionRef = collection(db, 'repuestos_redmi');
                const data = await getDocs(partesCollectionRef);
                
                fetchedParts = data.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                }));
                
                // LÓGICA CLAVE: Si Firebase devuelve 0 elementos, usamos la lista de respaldo.
                if (fetchedParts.length === 0) {
                    console.log("Base de datos vacía, usando lista por defecto para mantener las cards visibles.");
                    fetchedParts = DEFAULT_PARTES;
                }

            } catch (error) {
                // Si hay un error de conexión, usamos la lista por defecto.
                console.error("Error al conectar con Firebase, usando datos locales:", error);
                fetchedParts = DEFAULT_PARTES;
            } finally {
                setPartes(fetchedParts);
                // Seleccionar el primero
                if (fetchedParts.length > 0) {
                    setSelectedPartId(fetchedParts[0].id);
                }
                setLoading(false);
            }
        };

        obtenerPartes();
    }, []);

    // Helper: Determina el icono, usando IconoPiezaA como último recurso.
    const getIconForPart = (nombreParte) => {
        const nombre = (nombreParte || '').toLowerCase();
        
        if (nombre.includes('bateria')) return IconoBateriaV;
        if (nombre.includes('pantalla')) return IconoPantallaV;
        if (nombre.includes('flex de botones')) return IconoFlexBotonesV;
        if (nombre.includes('flex de carga')) return IconoflexcargaV;
        if (nombre.includes('puerto de carga')) return IconopuertocargaV;
        if (nombre.includes('vidrio templado')) return IconovidrioTV;
         if (nombre.includes('visor')) return IconovisorV;
        // --- RESGUARDO: LOGO DE CAJA AMARILLA POR DEFECTO ---
        return IconoPiezaA; 
    };

    return (
        <div className="page-wrapper"> 
            <NavBar /> 
            
            <main className="main-content-dashboard bg-gradient2">
                <Container className="mt-5 pb-5">
                    
                    <h2 className="section-title text-center mb-4">
                        Partes disponibles Redmi Note 8 (M1908c3jg):
                    </h2>

                    {loading ? (
                        <div className="text-center text-white loading-text">
                            <div className="spinner-border text-info me-2" role="status"></div>
                            Cargando repuestos...
                        </div>
                    ) : (
                        <div className="parts-grid">
                            {/* ESTE MAP SIEMPRE GENERA LAS CARDS (gracias a DEFAULT_PARTES) */}
                            {partes.map((parte) => (
                                <div 
                                    key={parte.id}
                                    className={`xiaomi-card ${selectedPartId === parte.id ? 'active' : ''}`}
                                    onClick={() => setSelectedPartId(parte.id)}
                                >
                                    <div className="card-image-placeholder">
                                        <img 
                                            // LÓGICA DE IMAGEN: 1. URL de Firebase > 2. Icono por nombre > 3. IconoPiezaA (caja amarilla)
                                            src={parte.imagenUrl || getIconForPart(parte.nombre || parte.name)} 
                                            alt={parte.nombre || "Repuesto"} 
                                            className="part-icon"
                                            // Respaldo final: si la URL de Firebase falla (404), usa IconoPiezaA
                                            onError={(e) => {
                                                e.target.onerror = null; 
                                                e.target.src = IconoPiezaA; 
                                            }}
                                        />
                                    </div>
                                    
                                    <div className="card-label">
                                        {/* Muestra el nombre o "Repuesto" */}
                                        {parte.nombre || parte.name || "Repuesto"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </Container>
            </main>
            
            <Footer /> 
        </div>
    );
}

export default BtnMasXiaomi;