import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Container } from 'react-bootstrap';
// import Swal from 'sweetalert2'; 
import { db } from '../../firebase'; // Asegúrate de que la ruta sea correcta
import './xiaomi.css'; 
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';

// Importación de Iconos e Imágenes
import IconologoXiami from '../../assets/logos/logoxiaomiverde2.png';
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
import IconopuertocargaR from '../../assets/Iconos/pindecargaV.png'; 
import IconovidrioTV from '../../assets/Iconos/vidrioTV.png'; 
import IconovidrioTR from '../../assets/Iconos/vidrioTR.png'; 
import IconovisorV from '../../assets/Iconos/visorV.png'; 
import IconoauricularV from '../../assets/Iconos/auricularV.png'; 
// --- LISTA DE RESPALDO (GARANTIZA LA VISIBILIDAD DE LAS 10 CARDS) ---
// Si Firebase no devuelve datos, esta lista se usa para que las tarjetas siempre estén visibles.
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
    const navigate = useNavigate();

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
                // filtramos por marca xiaomi/redmi (como en Xiaomi.jsx)
                const filtered = data.filter(u => {
                    const marca = (u.marca || '').toString().toLowerCase();
                    return marca === 'redmi' || marca === 'xiaomi';
                });
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
        if (!navState) return;
        const modeloBuscado = (navState.modelo || navState.nombre || '').toString().trim();
        if (!modeloBuscado) return;
        const found = modelos.find(m => {
            const mModelo = (m.modelo || '').toString().trim();
            const mNombre = (m.nombre || '').toString().trim();
            return mModelo === modeloBuscado || mNombre === modeloBuscado;
        });
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

    // Helper para obtener la info de la pieza dentro de un documento de `tablas`
    const getPiezaInfoFromModel = (modelEntry, nombrePiezaBD) => {
        if (!modelEntry || !Array.isArray(modelEntry.campos)) return null;
        return modelEntry.campos.find(c => (c.campo || '').toString().toUpperCase() === (nombrePiezaBD || '').toString().toUpperCase());
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
        if (nombre.includes('visor')) return has ? IconovisorV : IconoPiezaA;
        if (nombre.includes('auricular')) return has ? IconoauricularV : IconoPiezaA;

        return has ? IconoPiezaA : IconoPiezaA;
    };

    const handlePartClick = (parte) => {
        const nombre = (parte.nombre || parte.name || '').toString().trim();

        // Si se abrió la página indicando un modelo seleccionado por navegación, tratamos de usar ese modelo
        if (selectedModelEntry) {
            const piezaInfoActual = getPiezaInfoFromModel(selectedModelEntry, nombre);
            const codigoCompatibilidad = piezaInfoActual?.codigoCompatibilidad;
            const normalizeCode = (c) => (c === undefined || c === null) ? '' : String(c).trim().toLowerCase();

            if (!codigoCompatibilidad || normalizeCode(codigoCompatibilidad) === '') {
                Swal.fire({ icon: 'info', title: 'Sin compatibilidades', text: `El modelo seleccionado (${selectedModelEntry.nombre || selectedModelEntry.modelo || ''}) no tiene código de compatibilidad registrado para "${nombre}".` });
                return;
            }

            const normTarget = normalizeCode(codigoCompatibilidad);
            // Buscar todos los modelos que tengan esa misma pieza con el mismo codigo (comparación exacta normalizada)
            const modelosCompatibles = modelos.filter(m => {
                const info = getPiezaInfoFromModel(m, nombre);
                return normalizeCode(info?.codigoCompatibilidad) === normTarget;
            });

            const listaHTML = modelosCompatibles.length > 0
                ? modelosCompatibles.map(m => `<li style="text-align:left;margin-bottom:6px;">📱 ${m.nombre || ''} - <strong>${m.modelo || ''}</strong></li>`).join('')
                : '<li>No se encontraron modelos compatibles.</li>';

            const headerHtml = `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <img src="${IconologoXiami}" width="48" height="48" style="border-radius:6px;filter: drop-shadow(0 4px 8px rgba(0,0,0,0.25));" alt="Logo Xiaomi" />
                    <div style="line-height:1;">
                        <div style="font-weight:600">${selectedModelEntry.nombre || ''}</div>
                        <div style="font-size:0.95em;color:#cfe9e4">Modelo: <strong>${selectedModelEntry.modelo || ''}</strong></div>
                    </div>
                </div>
            `;

            Swal.fire({
                title: `Compatibilidades para: ${nombre}`,
                html: `${headerHtml}<div style="font-size: 0.95em;"><p style="margin-bottom: 10px;">El código <strong>${codigoCompatibilidad}</strong> es compatible con:</p><ul style="list-style: none; padding: 0; max-height: 260px; overflow-y: auto; border: 1px solid #eee; padding: 10px;">${listaHTML}</ul></div>`,
                icon: 'success',
                confirmButtonText: 'Cerrar',
                width: 680
            });
            return;
        }

        // Fallback: mostrar todos los modelos que tengan una entrada para esa pieza (sin comparar códigos)
        const compatibles = findCompatibilitiesForPart(nombre);
        if (!compatibles || compatibles.length === 0) {
            Swal.fire({ icon: 'info', title: 'Sin compatibilidades', text: `No se encontraron códigos de compatibilidad para "${nombre}" en la base de datos Xiaomi.` });
            return;
        }

        const listaHTML = compatibles.map(c => `<li style="text-align:left;margin-bottom:6px;">📱 ${c.modeloNombre || ''} - <strong>${c.modeloCodigo || ''}</strong> — Código: <code>${c.codigo}</code></li>`).join('');
        Swal.fire({
            title: `Compatibilidades para: ${nombre}`,
            html: `<div style="text-align:left"><ul style="list-style:none;padding:0;margin:0;max-height:240px;overflow:auto">${listaHTML}</ul></div>`,
            icon: 'success',
            confirmButtonText: 'Cerrar',
            width: 600
        });
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