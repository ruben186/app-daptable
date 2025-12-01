import { useNavigate  } from 'react-router-dom';
import { useEffect, useState} from 'react';
import { doc, getDoc, updateDoc, collection, query, limit, orderBy, getDocs} from 'firebase/firestore';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { FaSignOutAlt } from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { auth, db} from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import logo from '../../assets/logos/logoapp-daptable.jpeg';
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
                    {/* Opción por defecto o placeholder */}
                    <option value="" disabled>Selecciona una opción</option>
                    {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>
        );
    }
    
    // Si estamos editando y no hay opciones (input normal)
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
                    // Deshabilitar la edición del correo, ya que no se puede cambiar fácilmente en Firebase Auth
                    readOnly={name === 'email'} 
                    disabled={name === 'email'} 
                />
            </div>
        );
    }

    // Modo de solo lectura (Visualización)
    return (
        <div className="campo">
            <label className="campo-label">{label}</label>
            <div className="campo-valor">
                {/* Muestra el valor o un placeholder si está vacío */}
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
    const [totalHistorialCount, setTotalHistorialCount] = useState(0); // NUEVO: Para saber si hay más
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
                    // Fusionamos los datos de la autenticación con los de Firestore
                    const fullData = {
                        ...data,
                        email: user.email || data.email, // Aseguramos que el correo esté disponible
                    };
                    setDatosPerfil(fullData);
                    setDatosFormulario(fullData); // Inicializamos el formulario con los datos cargados
                } else {
                    console.log("No se encontró el perfil del usuario en Firestore.");
                    // Si no existe el documento, usamos solo los datos de Auth
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
                // Referencia a la subcolección: /usuarios/{UID}/historial_consultas
                const historialRef = collection(db, 'usuarios', user.uid, 'historial_consultas');
                
                const countQuery = query(historialRef);
                const countSnapshot = await getDocs(countQuery);
                const totalCount = countSnapshot.size;
                setTotalHistorialCount(totalCount);
                
                const actualLimit = Math.min(historialLimit, totalCount);

                // 2. OBTENER LOS DOCUMENTOS LIMITADOS
                if (totalCount === 0) {
                    setHistorial([]);
                    return;
                }
                const q = query(
                    historialRef,
                    orderBy('timestamp', 'desc'),
                    // Usamos el límite ajustado
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
                // Opcional: mostrar un mensaje de error leve
            }
        };

        fetchPerfil();
        fetchHistorial();
        fetchModelos();

    }, [user, historialLimit]);
      // Determinar foto de usuario
    const userPhoto = user?.photoURL || userDefault;
    
      // Agregamos el console.log para verificar qué foto se está usando
    console.log(
    user?.photoURL
        ? `Usuario tiene foto: ${user.photoURL}`
        : `Usuario SIN foto, se usará: ${userDefault}`
    );

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDatosFormulario(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // --- GUARDAR CAMBIOS EN FIRESTORE ---
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
                    background: '#052b27ff', // Color de fondo personalizado
                    color: '#ffdfdfff', // Color del texto personalizado
                    confirmButtonColor: '#0b6860ff',
                });
                return;
            }else{
                if (!soloLetras.test(datosFormulario.nombreCompleto)) {
                    Swal.fire({
                    title:"Error", 
                    text: "El campo de su nombre completo solo debe contener letras.", 
                    icon: "error",
                    background: '#052b27ff', // Color de fondo personalizado
                    color: '#ffdfdfff', // Color del texto personalizado
                    confirmButtonColor: '#0b6860ff',
                    });
                    return;
                }
                if (!soloNumeros.test(datosFormulario.telefono)) {
                    Swal.fire({
                    title:"Error", 
                    text: "El campo de telefono solo debe contener numeros.", 
                    icon: "error",
                    background: '#052b27ff', // Color de fondo personalizado
                    color: '#ffdfdfff', // Color del texto personalizado
                    confirmButtonColor: '#0b6860ff',
                    });
                    return;
                }
                if(datosFormulario.telefono.length > 10){
                    Swal.fire({
                    title:"Error", 
                    text: "El campo de telefono debe tener como maximo 10 caracteres.", 
                    icon: "error",
                    background: '#052b27ff', // Color de fondo personalizado
                    color: '#ffdfdfff', // Color del texto personalizado
                    confirmButtonColor: '#0b6860ff',
                    });
                    return;
                }
                
            }
            // Referencia al documento: /usuarios/{UID del usuario autenticado}
                const docRef = doc(db, 'usuarios', user.uid);

                // Usamos setDoc con { merge: true } para crear el documento si no existe o actualizarlo
                // O updateDoc si sabemos que el documento ya existe
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
                    confirmButtonColor: '#07433E',
                });
        } catch (error) {
            console.error("Error al guardar el perfil en Firestore:", error);
            Swal.fire('Error al Guardar', 'Hubo un problema al actualizar tu perfil.', 'error');
        }
    };

   const handleLogout = async () => {
        // Ejecuta la lógica de cierre de sesión SÓLO si el usuario confirmó
        try {
            await signOut(auth);
            navigate('/');
            console.log("Sesión cerrada exitosamente.");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            // Opcional: Mostrar un error con Swal si falla el cierre de sesión
            Swal.fire('Error', 'No se pudo cerrar la sesión. Inténtalo de nuevo.', 'error');
        }
    };

    // 2. Nueva función que muestra la advertencia de SweetAlert
    const confirmLogout = () => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¿Realmente quieres cerrar tu sesión actual?",
            icon: 'warning',
            background: '#052b27ff', // Color de fondo personalizado
            color: '#ffff', // Color del texto personalizado
            showCancelButton: true, // Muestra el botón de "Cancelar"
            confirmButtonColor: '#07433E', // Color del botón de confirmación
            cancelButtonColor: 'rgba(197, 81, 35, 1)', // Color del botón de cancelar
            confirmButtonText: 'Sí, cerrar sesión', // Texto del botón de confirmación
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            // SweetAlert devuelve un objeto `result`
            if (result.isConfirmed) {
                // Si el usuario hace clic en "Sí, cerrar sesión", llamamos a la función
                handleLogout();
            }
        });
    };
   const toggleHistorialView = () => {
        // La condición para "Ver menos" es si actualmente estamos mostrando más del mínimo.
        // Si el límite actual es el alto (VER_TODO) O si el historial ya está cargado completamente (historial.length === totalHistorialCount)
        const viendoTodo = historialLimit === LIMITE_VER_TODO || historial.length === totalHistorialCount;

        if (viendoTodo && totalHistorialCount > LIMITE_MINIMO) {
            // Si ya está mostrando todo (y hay más de 4), VUELVE al límite mínimo.
            setHistorialLimit(LIMITE_MINIMO);
        } else if (historialLimit === LIMITE_MINIMO && totalHistorialCount > LIMITE_MINIMO) {
            // Si está en el mínimo (4) y hay más, pasa a VER TODO.
            // Eliminamos el estado intermedio LIMITE_CON_SCROLL para simplificar el flujo.
            setHistorialLimit(LIMITE_VER_TODO);
        }
        // Si totalHistorialCount <= LIMITE_MINIMO, la función no hace nada, que es lo correcto.
    };
    const getButtonText = () => {
        // La cantidad mínima de elementos que necesitamos para que el botón sea relevante.
        const MIN_PARA_BOTON = LIMITE_MINIMO; 
        

        if (historialLimit === LIMITE_VER_TODO) {
            // Solo mostramos "Ver menos" si hay, de hecho, más de 4 elementos para ocultar.
            if (totalHistorialCount > MIN_PARA_BOTON) {
                return "Ver menos";
            }
            return null;
        }

        if (historialLimit === MIN_PARA_BOTON) {
            // Solo mostramos "Ver más" si hay más elementos que el mínimo.
            if (totalHistorialCount > MIN_PARA_BOTON) {
                // Muestra cuántos elementos hay en total para darle contexto al usuario.
                return `Ver más entradas`;
            }
        }
        
        // Si el límite actual es LIMITE_CON_SCROLL (el estado intermedio) O en cualquier otro caso.
        return null;
    };
    
    const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'Desconocido';
    const date = new Date(timestamp.seconds * 1000);
    // Opciones para un formato legible en español
    const options = { year: 'numeric', month: 'short', day: 'numeric'};
    return date.toLocaleDateString('es-CO', options);
    };
    const needsScroll = historialLimit === LIMITE_CON_SCROLL && historial.length > LIMITE_CON_SCROLL;
    

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
                        {/* El correo se obtiene de Auth, lo mostramos, pero lo deshabilitamos para edición simple */}
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
                            <img src={userPhoto} className="user-photo" alt=''/>
                        </div>
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
                                            {/* IMAGEN DE LA PIEZA (Se asume que la clase 'icono-pieza-historial' ya existe o la agregarás) */}
                                            <img 
                                                src={piezaIcono} 
                                                alt={actividad.Pieza || 'Pieza'} 
                                                className="icono-pieza-historial" 
                                            />
                                            
                                        </div>
                                        <div className="actividad-item-inferior">
                                            <strong className='text-center'>{actividad.Modelo || 'Modelo Desconocido'}</strong>
                                            <br />
                                            <span>Pieza: {actividad.Pieza || 'N/A'}</span>
                                            <br />
                                            {/* NUEVO: Contenedor flexible para el logo de la marca y el nombre de la pieza */}
                                            <div className="detalle-pieza-marca"> 
                                                {/* IMAGEN DE LA MARCA (Se asume que la clase 'logo-marca-historial' ya existe o la agregarás) */}
                                                <span>Marca:</span>
                                                {marcaLogoUrl && (
                                                     <img 
                                                        src={marcaLogoUrl} 
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