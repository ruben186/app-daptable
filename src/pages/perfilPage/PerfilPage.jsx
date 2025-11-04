import { useNavigate  } from 'react-router-dom';
import { useEffect, useState} from 'react';
import { doc, getDoc} from 'firebase/firestore';
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

function PerfilPage() {
    const [datosPerfil, setDatosPerfil] = useState([null]);
    const navigate = useNavigate();
    const [user] = useAuthState(auth);
    useEffect(() => {
    // Asegúrate de que el usuario esté autenticado antes de buscar
    if (!user || !user.uid) return; 

    const fetchPerfil = async () => {
        try {
            // Referencia al documento: /usuarios/{UID del usuario autenticado}
            const docRef = doc(db, 'usuarios', user.uid); 
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log("Datos del usuario encontrados:", docSnap.data());
                // Almacenar los datos del documento en el estado
                setDatosPerfil(docSnap.data());
            } else {
                // El documento del perfil no existe en Firestore
                console.log("No se encontró el perfil del usuario en Firestore.");
                setDatosPerfil({}); // Opcional: establecer un objeto vacío para manejar el "no encontrado"
            }
        } catch (error) {
            console.error("Error al obtener el perfil de Firestore:", error);
            // Manejo de error
        }
    };
    
    fetchPerfil();
// Se ejecuta cada vez que el objeto 'user' de autenticación cambia (es decir, cuando el usuario inicia sesión)
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
                    <div className="perfil-info">
                        <DisplayField label="Nombre y Apellido:" value={datosPerfil?.nombreCompleto || "sin nombre completo"}/>
                        <DisplayField label="Fecha de Nacimiento:"  placeholder="DD/MM/AAAA" value={datosPerfil?.fechaNacimiento || "sin fecha de nacimiento"}/>
                        <DisplayField label="Celular:" value={datosPerfil?.telefono || "sin numero de celular"}/>
                        <DisplayField label="Correo:" value={datosPerfil?.email || "sin correo"} />
                        <DisplayField label="Sexo:" value={datosPerfil?.sexo || "sin sexo"} />
                    </div>

                    <div className="perfil-avatar">
                        <div className="avatar-circulo">
                            <img src={userPhoto} alt="Foto de usuario" className="user-photo" />
                        </div>
                        <button className="editar-perfil-btn">Editar Perfil</button>
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