import { useNavigate  } from 'react-router-dom';
import { useEffect, useState} from 'react';
import { doc, getDoc, updateDoc, collection, query, limit, orderBy, getDocs} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db} from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import userDefault from '../../assets/logos/user.png'; 
import './PerfilPage.css';
import { handleCompatibilityCheck, getLogoUrlByMarca } from '../components/compatibilidades';
import { logActivity } from '../../firebase/historialService';
import Swal from 'sweetalert2';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import IconoPantallaV from '../../assets/Iconos/iconoPantallaVerde.png';
import IconoBateriaV from '../../assets/Iconos/IconoBateriaV.png';
import IconoFlexBotonesV from '../../assets/Iconos/flexBotonesV.png';
import IconoflexcargaV from '../../assets/Iconos/flexdeCargaV.png'; 
import IconopuertocargaV from '../../assets/Iconos/pindecargaV.png'; 
import IconovidrioTV from '../../assets/Iconos/vidrioTV.png'; 
import IconovisorV from '../../assets/Iconos/visorV.png'; 
import IconoauricularV from '../../assets/Iconos/auricularV.png'; 
import IconoPiezaA from '../../assets/Iconos/IconoPiezaA.png'; 

const EditableField = ({ label, value, name, type = 'text', onChange, isEditing, options }) => {
    // Si estamos editando y hay opciones (para el select de Sexo)
    if (isEditing && options) {
        return (
            <div className="campo">
                <label className="campo-label">{label}</label>
                <select 
                    name={name} 
                    value={value || ''} 
                    onChange={onChange} 
                    className="campo-valor"
                >
                    <option value="" disabled>Selecciona una opción</option>
                    {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>
        );
    }
    
    if (isEditing) {
        return (
            <div className="campo">
                <label className="campo-label">{label}</label>
                <input
                    type={type}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    className="campo-valor"
                    // Deshabilitar la edición del correo
                    readOnly={name === 'email'} 
                    disabled={name === 'email'} 
                />
            </div>
        );
    }

    // Modo de solo lectura 
    return (
        <div className="campo">
            <label className="campo-label">{label}</label>
            <div className="campo-valor">
                {value || "no encontrado"}
            </div>
        </div>
    );
};

const LIMITE_MINIMO = 5;
const LIMITE_CON_SCROLL = 10;
const LIMITE_VER_TODO = 50;

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

function PerfilPage() {
    const [datosPerfil, setDatosPerfil] = useState([null]);
    const [datosFormulario, setDatosFormulario] = useState({});
    // Estado para controlar el modo de edición
    const [modoEdicion, setModoEdicion] = useState(false);
    // Estado de carga
    const [isLoading, setIsLoading] = useState(true);
    const [historial, setHistorial] = useState([]);
    const [selectedActivityId, setSelectedActivityId] = useState(null);
    const [historialLimit, setHistorialLimit] = useState(LIMITE_MINIMO); 
    const [totalHistorialCount, setTotalHistorialCount] = useState(0);
    const [modelos, setModelos] = useState([]);
    const navigate = useNavigate();
    const [user] = useAuthState(auth);

    useEffect(() => {
        // Asegúrate de que el usuario esté autenticado antes de buscar
        if (!user || !user.uid) return; 

        const fetchPerfil = async () => {
        try {
                const docRef = doc(db, 'usuarios', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const fullData = {
                        ...data,
                        email: user.email || data.email, // Aseguramos que el correo esté disponible
                    };
                    setDatosPerfil(fullData);
                    setDatosFormulario(fullData);
                } else {
                    console.log("No se encontró el perfil del usuario en Firestore.");
                    const defaultData = {
                        nombreCompleto: user.displayName || '',
                        email: user.email || '',
                        fechaNacimiento: '',
                        telefono: '',
                        sexo: '',
                    };
                    setDatosPerfil(defaultData);
                    setDatosFormulario(defaultData);
                }
            } catch (error) {
                console.error("Error al obtener el perfil de Firestore:", error);
                Swal.fire('Error de Carga', 'No se pudo cargar la información del perfil.', 'error');
            } finally {
                setIsLoading(false);
            }
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
        
        const fetchHistorial = async () => {
            try {
                const historialRef = collection(db, 'usuarios', user.uid, 'historial_consultas');
                const countQuery = query(historialRef);
                const countSnapshot = await getDocs(countQuery);
                const totalCount = countSnapshot.size;
                setTotalHistorialCount(totalCount);
                const actualLimit = Math.min(historialLimit, totalCount);

                // OBTENER LOS DOCUMENTOS LIMITADOS
                if (totalCount === 0) {
                    setHistorial([]);
                    return;
                }
                const q = query(
                    historialRef,
                    orderBy('timestamp', 'desc'),
                    limit(actualLimit) 
                );
            
                const querySnapshot = await getDocs(q);
                
                const historialData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setHistorial(historialData);
            } catch (error) {
                console.error("Error al obtener el historial:", error);
            }
        };

        fetchPerfil();
        fetchHistorial();
        fetchModelos();
    }, [user, historialLimit]);

    // Determinar foto de usuario
    const userPhoto = user?.photoURL || userDefault;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDatosFormulario(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const MIN_AGE = 1;
    const MAX_AGE = 120;

    const validateAge = (birthDateString) => {
      if (!birthDateString) return false;
      const birthDate = new Date(birthDateString);
      const today = new Date();
      // Calcula la diferencia en milisegundos
      const ageInMilliseconds = today.getTime() - birthDate.getTime();
      // Convierte milisegundos a años
      const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

      return ageInYears >= MIN_AGE && ageInYears <= MAX_AGE;
    };

    const guardarCambios = async () => {
        if (!user || !user.uid) return;
        // Quitamos campos no necesarios o solo de Auth antes de guardar
        const { email, ...dataToSave } = datosFormulario;
        
        try {
            const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
            const soloNumeros = /^[0-9]+$/;
            if(datosFormulario.nombreCompleto === '' || datosFormulario.telefono === '' 
                || datosFormulario.email === '' || datosFormulario.fechaNacimiento === '' || datosFormulario.sexo === ''){
                Swal.fire({
                    title:"Campos incompletos", 
                    text: "Todos los campos deben ser llenados.", 
                    icon: "error",
                    background: '#052b27ff', 
                    color: '#ffdfdfff', 
                    confirmButtonColor: '#0b6860ff'
                });
                return;
            }else{
                if (!soloLetras.test(datosFormulario.nombreCompleto)) {
                    Swal.fire({
                        title:"Error", 
                        text: "El campo de su nombre completo solo debe contener letras.", 
                        icon: "error",
                        background: '#052b27ff', 
                        color: '#ffdfdfff', 
                        confirmButtonColor: '#0b6860ff'
                    });
                    return;
                }

                if (!soloNumeros.test(datosFormulario.telefono)) {
                    Swal.fire({
                        title:"Error", 
                        text: "El campo de telefono solo debe contener numeros.", 
                        icon: "error",
                        background: '#052b27ff', 
                        color: '#ffdfdfff', 
                        confirmButtonColor: '#0b6860ff'
                    });
                    return;
                }
                
                if (!validateAge(datosFormulario.fechaNacimiento)) {
                    Swal.fire({
                        title: "Error",
                        text: `La fecha de nacimiento es invalida.`,
                        icon: "error",
                        background: '#052b27ff',
                        color: '#ffdfdfff',
                        confirmButtonColor: '#0b6860ff'
                    });
                    return;
                }

                if(datosFormulario.telefono.length > 10){
                    Swal.fire({
                    title:"Error", 
                    text: "El campo de telefono debe tener como maximo 10 caracteres.", 
                    icon: "error",
                    background: '#052b27ff',
                    color: '#ffdfdfff', 
                    confirmButtonColor: '#0b6860ff'
                    });
                    return;
                }
            }
            const docRef = doc(db, 'usuarios', user.uid);
            // UpdateDoc si sabemos que el documento ya existe
            await updateDoc(docRef, dataToSave); 
            
            // Actualizamos el estado de visualización con los datos guardados
            setDatosPerfil(datosFormulario);
            setModoEdicion(false); // Salimos del modo edición
            
            Swal.fire({
                title: '¡Guardado!',
                text: 'Tu perfil ha sido actualizado exitosamente.',
                icon: 'success',
                background: '#052b27ff',
                color: '#ffff',
                confirmButtonColor: '#07433E'
            });
        } catch (error) {
            console.error("Error al guardar el perfil en Firestore:", error);
            Swal.fire('Error al Guardar', 'Hubo un problema al actualizar tu perfil.', 'error');
        }
    };

    const handleLogout = async () => {
        // Ejecuta la lógica de cierre de sesión SÓLO si el usuario confirmó
        try {
            navigate('/');
            await signOut(auth);
            Swal.fire({
                title: 'Sesión Cerrada',
                text: "Sesión cerrada exitosamente.",
                icon: 'success',
                timer: 2500,
                background: '#052b27ff', 
                color: '#ffff', 
                showConfirmButton: false
            })
            console.log("Sesión cerrada exitosamente.");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            Swal.fire('Error', 'No se pudo cerrar la sesión. Inténtalo de nuevo.', 'error');
        }
    };

    const confirmLogout = () => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¿Realmente quieres cerrar tu sesión actual?",
            icon: 'warning',
            background: '#052b27ff',
            color: '#ffff', 
            showCancelButton: true,
            confirmButtonColor: '#07433E', 
            cancelButtonColor: 'rgba(197, 81, 35, 1)', 
            confirmButtonText: 'Sí, cerrar sesión', 
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                handleLogout();
            }
        });
    };

    const toggleHistorialView = () => {
        // Si el límite actual es el alto (VER_TODO)
        const viendoTodo = historialLimit === LIMITE_VER_TODO || historial.length === totalHistorialCount;

        if (viendoTodo && totalHistorialCount > LIMITE_MINIMO) {
            //VUELVE al límite mínimo.
            setHistorialLimit(LIMITE_MINIMO);
        } else if (historialLimit === LIMITE_MINIMO && totalHistorialCount > LIMITE_MINIMO) {
            // Si está en el mínimo y hay más, pasa a VER TODO.
            setHistorialLimit(LIMITE_VER_TODO);
        }
    };

    const getButtonText = () => {
        // La cantidad mínima de elementos que necesitamos para que el botón sea relevante.
        const MIN_PARA_BOTON = LIMITE_MINIMO; 
        

        if (historialLimit === LIMITE_VER_TODO) {
            // Solo mostramos "Ver menos" si hay, de hecho, más del minimo elementos para ocultar.
            if (totalHistorialCount > MIN_PARA_BOTON) {
                return "Ver menos";
            }
            return null;
        }

        if (historialLimit === MIN_PARA_BOTON) {
            // Solo mostramos "Ver más" si hay más elementos que el mínimo.
            if (totalHistorialCount > MIN_PARA_BOTON) {
                return `Ver más entradas`;
            }
        }
        return null;
    };
    
    const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'Desconocido';
        const date = new Date(timestamp.seconds * 1000);
        const options = { year: 'numeric', month: 'short', day: 'numeric'};
        return date.toLocaleDateString('es-CO', options);
    };

    const needsScroll = historialLimit === LIMITE_CON_SCROLL && historial.length > LIMITE_CON_SCROLL;
    
    const handleActivityClick = (id) => {
        // Establece el ID de la actividad como seleccionada. 
        setSelectedActivityId(id);
    };

    const handleHistoryClick = (historialItem) => {
        const { Modelo, Pieza } = historialItem;
        const userActual = modelos.find(m => 
            (m.modelo || '').toString().trim() === Modelo || (m.nombre || '').toString().trim() === Modelo
        );

        if (!userActual) {
            Swal.fire({
                icon: 'warning',
                title: 'Modelo no encontrado',
                text: `No se pudo encontrar la información completa del modelo: ${Modelo}.`
            });
            return;
        }
        handleCompatibilityCheck(Pieza, userActual, modelos, logActivity, user);
    };

    return (
        <>  
            <NavBar/>
            <div className='body-perfil bg-gradient2'>
            <div className="perfil-container">
                    {/* Encabezado */}
                    <header className="perfil-header">
                        <h4>Mi Perfil</h4>
                    </header>

                    {/* Contenido Principal (Información y Avatar) */}
                    <main className="perfil-main">
                        <div className="perfil-info">
                            <EditableField
                                label="Nombre y Apellido:"
                                name="nombreCompleto"
                                value={datosFormulario?.nombreCompleto}
                                isEditing={modoEdicion}
                                onChange={handleInputChange}
                            />
                            <EditableField
                                label="Fecha de Nacimiento:"
                                name="fechaNacimiento"
                                type="date"
                                value={datosFormulario?.fechaNacimiento}
                                isEditing={modoEdicion}
                                onChange={handleInputChange}
                            />
                            <EditableField
                                label="Celular:"
                                name="telefono"
                                type="tel"
                                value={datosFormulario?.telefono}
                                isEditing={modoEdicion}
                                onChange={handleInputChange}
                            />
                            <EditableField
                                label="Correo:"
                                name="email"
                                type="email"
                                value={datosFormulario?.email}
                                isEditing={modoEdicion}
                                onChange={handleInputChange}
                            />
                            <EditableField
                                label="Sexo:"
                                name="sexo"
                                value={datosFormulario?.sexo}
                                isEditing={modoEdicion}
                                onChange={handleInputChange}
                                options={['Masculino', 'Femenino', 'Prefiero no decirlo']}
                            />
                        </div>

                        <div className="perfil-avatar">
                            <div className="avatar-circulo">
                                <img src={userPhoto} loading="lazy" className="user-photo" alt=''/>
                            </div>
                            <div className='opciones-perfil'>
                                {modoEdicion ? (
                                    <>
                                        <button className="editar-perfil-btn save-btn" onClick={guardarCambios}>
                                            Guardar Cambios
                                        </button>
                                        <button className="editar-perfil-btn cancel-btn" onClick={() => {
                                            setModoEdicion(false);
                                            // Restaurar datos del formulario a los datos del perfil guardados
                                            setDatosFormulario(datosPerfil);
                                        }}>
                                            Cancelar
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        className="editar-perfil-btn" 
                                        onClick={() => setModoEdicion(true)}
                                    >
                                        Editar Perfil
                                    </button>
                                )}
                                <button className="editar-perfil-btn" onClick={confirmLogout}>Cerrar Sesión</button>
                            </div>
                        </div>
                    </main>
                    <h4>Actividades Recientes:</h4>
                    <div className='d-flex justify-content-center'>
                        <section className={`actividades-recientes-grid ${needsScroll ? 'scroll-on' : ''}`}>
                            {isLoading ? (
                                <p className="text-center">Cargando historial...</p>
                            ) : historial.length > 0 ? (
                                historial.map((actividad, index) => {
                                    // Lógica para obtener la información del modelo (marca y logo)
                                    const marcaLogoUrl = getLogoUrlByMarca(actividad.Marca);
                                    const isActive = actividad.id === selectedActivityId;
                                    // Lógica para determinar el icono de la pieza
                                    const piezaKey = actividad.Pieza?.toUpperCase();
                                    const piezaIcono = PIEZA_ICONOS[piezaKey] || PIEZA_ICONOS['OTRO']
                                    
                                    return (
                                        <div className={`actividad-item ${isActive ? 'active' : ''}`}
                                            key={actividad.id || index}
                                            onClick={(e) => {
                                                handleHistoryClick(actividad);
                                                handleActivityClick(actividad.id);
                                            }}
                                        >
                                            <div className="actividad-item-superior">
                                                <img 
                                                    src={piezaIcono} 
                                                    loading="lazy"
                                                    alt={actividad.Pieza || 'Pieza'} 
                                                    className="icono-pieza-historial" 
                                                />
                                            </div>
                                            <div className="actividad-item-inferior">
                                                <strong className='text-center'>{actividad.Modelo || 'Modelo Desconocido'}</strong>
                                                <br />
                                                <span>Pieza: {actividad.Pieza || 'N/A'}</span>
                                                <br />
                                                <div className="detalle-pieza-marca"> 
                                                    <span>Marca:</span>
                                                    {marcaLogoUrl && (
                                                        <img 
                                                            src={marcaLogoUrl} 
                                                            loading="lazy"
                                                            alt={actividad.Marca || 'Marca'}
                                                            className="logo-marca-historial" 
                                                        />
                                                    )}
                                                    <span>{actividad.Marca || 'Marca Desconocida'}</span>
                                                </div>
                                                <small className='pdf-card-date'>{actividad.timestamp ? formatTimestamp(actividad.timestamp) : 'Fecha N/A'}</small>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-center">No hay actividad reciente registrada.</p>
                            )}
                        </section>
                    </div>
                    {getButtonText() && (
                    <div className="d-flex justify-content-center mt-3">
                        <button className="btn btn-secondary btn-generar" onClick={toggleHistorialView}>
                            {getButtonText()}
                        </button>
                    </div>
                    )}
                </div>
            </div>
            <Footer/>
        </>
    );
}

export default PerfilPage;