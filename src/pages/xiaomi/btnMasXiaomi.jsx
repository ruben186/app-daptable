import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase'; 
import { logActivity } from '../../firebase/historialService';
import { 
    handleCompatibilityCheck,
    getPiezaInfoFromModel 
} from '../components/compatibilidades';
import { db } from '../../firebase'; 
import './xiaomi.css'; 
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
//importaciones de iconos imagenes 
import IconoPantallaV from '../../assets/Iconos/iconoPantallaVerde.png';
import IconoPantallaR from '../../assets/Iconos/iconoPantallaRojo.png';
import IconoBateriaV from '../../assets/Iconos/IconoBateriaV.png';
import IconoBateriaR from '../../assets/Iconos/IconoBateriaR3.png';
import IconoFlexBotonesV from '../../assets/Iconos/flexBotonesV.png';
import IconoFlexBotonesR from '../../assets/Iconos/flexBotonesR.png';
import IconoPiezaA from '../../assets/Iconos/IconoPiezaA.png'; 
import IconoflexcargaV from '../../assets/Iconos/flexdeCargaV.png'; 
import IconoflexcargaR from '../../assets/Iconos/flexCargaR.png'; 
import IconopuertocargaV from '../../assets/Iconos/pindecargaV.png'; 
import IconopuertocargaR from '../../assets/Iconos/pindecargaR.png'; 
import IconovidrioTV from '../../assets/Iconos/vidrioTV.png'; 
import IconovidrioTR from '../../assets/Iconos/vidrioTR.png'; 
import IconovisorV from '../../assets/Iconos/visorV.png'; 
import IconovisorR from '../../assets/Iconos/visorR.png'; 
import IconoauricularV from '../../assets/Iconos/auricularV.png'; 
import IconoauricularR from '../../assets/Iconos/auricularR.png'; 

const DEFAULT_PARTES = [
    { id: 'def1', name: "puerto de carga" },
    { id: 'def2', name: "Bateria" },
    { id: 'def3', name: "Pantalla" },
    { id: 'def4', name: "Flex de carga" },
    { id: 'def5', name: "Auricular" },
    { id: 'def6', name: "Flex de Botones" },
    { id: 'def7', name: "Vidrio templado" },
    { id: 'def8', name: "Visor" },
   
];

function BtnMasXiaomi() {
    const [user] = useAuthState(auth);

    // Estados
    const [partes, setPartes] = useState([]);
    const [selectedPartId, setSelectedPartId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modelos, setModelos] = useState([]); // tablas (modelos Xiaomi/Redmi)
    const location = useLocation();
    const navState = location?.state || null; // { nombre, modelo }
    const [selectedModelEntry, setSelectedModelEntry] = useState(null);

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
        // además cargamos los modelos desde 'tablas' para comprobar compatibilidades
        const fetchModelos = async () => {
            try {
                const snap = await getDocs(collection(db, 'tablas'));
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Detectar brand desde navState
                const brandParam = navState?.brand ? navState.brand.toString().toLowerCase() : null;
                console.log("Brand detectado en fetchModelos:", brandParam);

                // Aliases para marcas (coincide con xiaomi.jsx)
                const brandAliases = {
                    samsung: ['samsung', 'samgsumg'],
                    xiaomi: ['xiaomi', 'redmi'],
                    motorola: ['motorola', 'moto'],
                    huawei: ['huawei'],
                    oppo: ['oppo'],
                    realme: ['realme'],
                    vivo: ['vivo'],
                    zte: ['zte']
                };

                let filtered = [];

                if (brandParam) {
                    const aliases = brandAliases[brandParam] || [brandParam];
                    console.log("Filtrando por marca", brandParam, "con aliases:", aliases);
                    filtered = data.filter(u => {
                        const m = (u.marca || '').toString().toLowerCase();
                        return aliases.some(a => (m && (m === a || m.includes(a) || a.includes(m))));
                    });
                } else {
                    // Comportamiento por defecto: mostrar solo Xiaomi/Redmi
                    console.log("No hay brand, filtrando por defecto a Xiaomi/Redmi");
                    filtered = data.filter(u => {
                        const marca = (u.marca || '').toString().toLowerCase();
                        return marca === 'redmi' || marca === 'xiaomi';
                    });
                }

                console.log("Modelos filtrados:", filtered.length);
                setModelos(filtered);
            } catch (e) {
                console.error('No se pudieron cargar modelos (tablas):', e);
                setModelos([]);
            }
        };
        fetchModelos();
    }, []);

    // Cuando `modelos` cambie, intentar resolver el modelo pasado por navegación
    useEffect(() => {
        if (!navState) {
            console.log("No hay navState disponible");
            return;
        }
        const modeloBuscado = (navState.modelo || navState.nombre || '').toString().trim();
        if (!modeloBuscado) {
            console.log("No hay modelo buscado en navState");
            return;
        }
        console.log("Buscando modelo:", modeloBuscado);
        const found = modelos.find(m => {
            const mModelo = (m.modelo || '').toString().trim();
            const mNombre = (m.nombre || '').toString().trim();
            return mModelo === modeloBuscado || mNombre === modeloBuscado;
        });
        console.log("Modelo encontrado:", found);
        if (found) setSelectedModelEntry(found);
    }, [modelos, navState]);

    // Busca dentro de `modelos` (colección 'tablas') compatibilidades para el nombre de pieza dado.
    const findCompatibilitiesForPart = (nombreParte) => {
        if (!nombreParte) return [];
        const needle = nombreParte.toString().trim().toUpperCase();
        const results = [];
        modelos.forEach(m => {
            if (!Array.isArray(m.campos)) return;
            const match = m.campos.find(c => (c.campo || '').toString().toUpperCase() === needle);
            if (match && match.codigoCompatibilidad && String(match.codigoCompatibilidad).trim() !== '') {
                results.push({ modeloNombre: m.nombre || m.marca || '', modeloCodigo: m.modelo || '', codigo: match.codigoCompatibilidad, modelEntry: m });
            }
        });
        return results;
    };

    // Determina el icono (verde/rojo) según si existen compatibilidades para la pieza en la colección 'tablas'
    const getIconForPart = (nombreParte) => {
        const nombre = (nombreParte || '').toString().toLowerCase();
        const compatibles = findCompatibilitiesForPart(nombreParte);
        const has = compatibles && compatibles.length > 0;

        // Mapea el tipo de pieza a iconos verde/rojo
        if (nombre.includes('bateria')) return has ? IconoBateriaV : IconoBateriaR;
        if (nombre.includes('pantalla')) return has ? IconoPantallaV : IconoPantallaR;
        if (nombre.includes('flex de botones') || nombre.includes('flex botones') || nombre.includes('flex de botón')) return has ? IconoFlexBotonesV : IconoFlexBotonesR;
        if (nombre.includes('flex de carga') || nombre.includes('flex carga')) return has ? IconoflexcargaV : IconoflexcargaR;
        if (nombre.includes('puerto de carga') || nombre.includes('pin') || nombre.includes('puerto')) return has ? IconopuertocargaV : (IconopuertocargaR || IconoPiezaA);
        if (nombre.includes('vidrio')) return has ? IconovidrioTV : IconovidrioTR;
        if (nombre.includes('visor')) return has ? IconovisorV : IconovisorR ;
        if (nombre.includes('auricular')) return has ? IconoauricularV : IconoauricularR;

        return has ? IconoPiezaA : IconoPiezaA;
    };

    // Función para manejar clic en iconos dinámicos
    const handleIconClick = (tipoPieza, userActual) => {
        console.log("handleIconClick ejecutado. Pieza:", tipoPieza, "Usuario:", userActual);

        handleCompatibilityCheck(
            tipoPieza, 
            userActual, 
            modelos, 
            logActivity, 
            user
        );
    };

    return (
        <div className="page-wrapper"> 
            <NavBar /> 
            <main className="main-content-dashboard bg-gradient2">
                <Container className="mt-5 pb-5">
                    <h2 className="section-title text-center mb-4">
                        {selectedModelEntry 
                            ? `Partes disponibles ${selectedModelEntry.nombre || ''} (${selectedModelEntry.modelo || ''}):`
                            : 'Partes disponibles:'
                        }
                    </h2>
                    {loading ? (
                        <div className="text-center text-white loading-text">
                            <div className="spinner-border text-info me-2" role="status"></div>
                            Cargando repuestos...
                        </div>
                    ) : (
                        <div className="parts-grid">
                            {/* ESTE MAP SIEMPRE GENERA LAS CARDS (gracias a DEFAULT_PARTES) */}
                            {partes.map((parte) => {
                                // Determinar la imagen que debe mostrarse para esta pieza.
                                const nombreParte = parte.nombre || parte.name || '';

                                const piezaInfoSel = selectedModelEntry ? getPiezaInfoFromModel(selectedModelEntry, nombreParte) : null;
                                // Helper rápido para obtener el icono "rojo" según el nombre de la pieza
                                const getRedIcon = (n) => {
                                    const s = (n || '').toString().toLowerCase();
                                    if (s.includes('bateria')) return IconoBateriaR;
                                    if (s.includes('pantalla')) return IconoPantallaR;
                                    if (s.includes('flex de botones') || s.includes('flex botones') || s.includes('flex de botón')) return IconoFlexBotonesR;
                                    if (s.includes('flex de carga') || s.includes('flex carga')) return IconoflexcargaR;
                                    if (s.includes('puerto de carga') || s.includes('pin') || s.includes('puerto')) return IconopuertocargaR || IconoPiezaA;
                                    if (s.includes('vidrio')) return IconovidrioTR;
                                    if (s.includes('visor')) return IconovisorR;
                                    if (s.includes('auricular')) return IconoauricularR;
                                    return IconoPiezaA;
                                };

                                // Si hay un modelo seleccionado y no existe código de compatibilidad para esta pieza, forzamos icono rojo.
                                let computedSrc = null;
                                const hasCodigo = piezaInfoSel && piezaInfoSel.codigoCompatibilidad && String(piezaInfoSel.codigoCompatibilidad).trim() !== '';
                                if (selectedModelEntry && !hasCodigo) {
                                    computedSrc = getRedIcon(nombreParte);
                                } else {
                                    // Comportamiento habitual: preferir `imagenUrl` si existe, sino mapa por nombre
                                    computedSrc = parte.imagenUrl || getIconForPart(nombreParte);
                                }

                                return (
                                    <div 
                                        key={parte.id}
                                        className={`xiaomi-card ${selectedPartId === parte.id ? 'active' : ''}`}
                                        onClick={(e) => { 
                                            e.stopPropagation();
                                            setSelectedPartId(parte.id);
                                            console.log("Imagen presionada. Pieza:", nombreParte, "Modelo:", selectedModelEntry);
                                            handleIconClick(nombreParte, selectedModelEntry);
                                        }}
                                    >
                                        <div className="card-image-placeholder" style={{ position: 'relative' }}>
                                            <Button
                                                variant="link"
                                                className="p-0 border-0 icon-hover-effect image-btn"

                                            >
                                                <img 
                                                    src={computedSrc} 
                                                    alt={parte.nombre || "Repuesto"} 
                                                    loading="lazy"
                                                    className="part-icon"
                                                    onError={(e) => {
                                                        e.target.onerror = null; 
                                                        e.target.src = IconoPiezaA; 
                                                    }} 
                                                />
                                            </Button>
                                        </div>
                                        
                                        <div className="card-label">
                                            {parte.nombre || parte.name || "Repuesto"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Container>
            </main>
            <Footer /> 
        </div>
    );
}

export default BtnMasXiaomi;