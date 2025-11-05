import { useNavigate  } from 'react-router-dom';
import { useEffect, useState} from 'react';
import { doc, getDoc, updateDoc} from 'firebase/firestore';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { FaSignOutAlt } from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { auth, db} from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import logo from '../../assets/logos/logoapp-daptable.jpeg';
import userDefault from '../../assets/logos/user.png'; 
import './PerfilPage.css';
import Swal from 'sweetalert2';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';



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
                    className="campo-input"
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
                    className="campo-input"
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
                {value || <span className="placeholder">No especificado</span>}
            </div>
        </div>
    );
};

function PerfilPage() {
    const [datosPerfil, setDatosPerfil] = useState([null]);
    const [datosFormulario, setDatosFormulario] = useState({});
    // Estado para controlar el modo de edición
    const [modoEdicion, setModoEdicion] = useState(false);
    // Estado de carga
    const [isLoading, setIsLoading] = useState(true);

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

        fetchPerfil();
    }, [user]);
      // Determinar foto de usuario
    const userPhoto = user?.photoURL || userDefault;
    
      // Agregamos el console.log para verificar qué foto se está usando
    console.log(
    user?.photoURL
        ? `Usuario tiene foto: ${user.photoURL}`
        : `Usuario SIN foto, se usará: ${userDefault}`
    );

    const DisplayField = ({ label, value, placeholder = '' }) => (
        <div className="campo">
            <label className="campo-label">{label}</label>
            <div className="campo-valor">
                {/* Muestra el valor o el placeholder si el valor está vacío */}
                {value || <span className="placeholder">{placeholder}</span>}
            </div>
        </div>
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
    
      
  return (
    <>  
        <NavBar/>
        <div className='body-perfil bg-gradient2'>
            <button type="button" className="btn-outline-secondary" onClick={() => window.location.href = "/dashboard"}>
                &lt; Volver
            </button>
           <div className="perfil-container">
                {/* Encabezado */}
                <header className="perfil-header">
                <h4>Mi Perfil</h4>
                </header>

                {/* Contenido Principal (Información y Avatar) */}
                <main className="perfil-main">
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
                            options={['Masculino', 'Femenino', 'Otro']}
                        />
                    </div>

                    <div className="perfil-avatar">
                        <div className="avatar-circulo">
                            <img src={userPhoto} alt="Foto de usuario" className="user-photo" />
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
                    {/* Actividades Recientes */}
                    <section className="actividades-recientes-grid">
                        <div className="actividad-item">
                            {/* Estructura interna requerida */}
                            <div className="actividad-item-superior"></div>
                            <div className="actividad-item-inferior"></div>
                        </div>
                        <div className="actividad-item">
                            <div className="actividad-item-superior"></div>
                            <div className="actividad-item-inferior"></div>
                        </div>
                        <div className="actividad-item">
                            <div className="actividad-item-superior"></div>
                            <div className="actividad-item-inferior"></div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
        <Footer/>
    </>
  );
}

export default PerfilPage;