import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown, Table, Button, Form, Modal, Image, InputGroup } from 'react-bootstrap';
import { FaEdit, FaTrash, FaUserCircle, FaPlus, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import './gestionUsuarioPage.css';
import logo from '../../assets/logos/logoapp-daptable.jpeg';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';
import IconoEditar from '../../assets/Iconos/iconoEditar.png';
import IconoEliminar from '../../assets/Iconos/iconoEliminar.png';
import IconoUsuario from '../../assets/Iconos/usuario2.png';

function GestionUsuariosPage() {
    const navigate = useNavigate(); // Añadir useNavigate
    const [usuarios, setUsuarios] = useState([]);
    const [usuariosFiltrados, setUsuariosFiltrados] = useState([]); // Nuevo estado para usuarios filtrados
    const [showModal, setShowModal] = useState(false);
    const [selectedAux, setSelectedAux] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Nuevo estado para la búsqueda

    useEffect(() => {
       const fetchUsuarios = async () => {
         const querySnapshot = await getDocs(collection(db, 'usuarios'));
         const data = querySnapshot.docs
            .map(doc => ({
            id: doc.id,
            ...doc.data()
            }))
            .filter(user => {
            const rol = user.rol?.toLowerCase();
            return rol === 'admin' || rol === 'usuario' || rol === 'invitado' || rol === '-';
            });

         setUsuarios(data);
         setUsuariosFiltrados(data); // Inicialmente, filtrados es igual a todos
        };
        fetchUsuarios();
    }, []);

    // Hook para manejar la lógica de búsqueda
    useEffect(() => {
        const results = usuarios.filter(user => 
            user.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.rol?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setUsuariosFiltrados(results);
    }, [searchTerm, usuarios]); // Se ejecuta cuando cambia el término de búsqueda o la lista original de usuarios
    
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleNuevo = () => {
        // Asumiendo que tienes una ruta para crear un nuevo usuario
        navigate('/nuevoUsuario'); 
    };

    const handleEliminar = async (id) => {
         const result = await Swal.fire({
             title:"¿Estas Seguro?", 
             text: "¡No podrás recuperar este registro!", 
             icon: "warning",
             showCancelButton: true,
             background: '#052b27ff', // Color de fondo personalizado
             color: '#ffdfdfff', // Color del texto personalizado
             confirmButtonColor: '#07433E', // Color del botón de confirmación
             cancelButtonColor: 'rgba(197, 81, 35, 1)',
             confirmButtonText: 'Sí, eliminar',
             cancelButtonText: 'Cancelar'
         });

         if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, 'usuarios', id));
                setUsuarios(usuarios.filter(a => a.id !== id));
                Swal.fire({
                    title: 'Eliminado', 
                    text: 'Registro eliminado correctamente.', 
                    icon: 'success',
                    background: '#052b27ff', // Color de fondo personalizado
                    color: '#ffdfdfff', // Color del texto personalizado
                    confirmButtonColor: '#0b6860ff'
                });
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title:"Error", 
                    text: "No se puedo eliminar el registro.", 
                    icon: "error",
                    background: '#052b27ff', // Color de fondo personalizado
                    color: '#ffdfdfff', // Color del texto personalizado
                    confirmButtonColor: '#0b6860ff',
                });
            }
         }
    };

    const handleEdit = (aux) => {
         setSelectedAux({
             ...aux,
             edad: calcularEdad(aux.fechaNacimiento)
         });
         setShowModal(true);
    };

    const handleSaveChanges = async () => {
         try {
             const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
             const soloNumeros = /^[0-9]+$/;
             if(selectedAux.nombreCompleto === '' || selectedAux.telefono === '' 
                 || selectedAux.email === '' || selectedAux.fechaNacimiento === '' || selectedAux.sexo === '' || selectedAux.estado === ''
                 || selectedAux.rol === ''){
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
                 if (!soloLetras.test(selectedAux.nombreCompleto)) {
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
                 if (!soloNumeros.test(selectedAux.telefono)) {
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
                 if(selectedAux.telefono.length > 10){
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
             const auxRef = doc(db, 'usuarios', selectedAux.id);
             await updateDoc(auxRef, {
                 nombreCompleto: selectedAux.nombreCompleto,
                 telefono: selectedAux.telefono,
                 email: selectedAux.email,
                 fechaNacimiento: selectedAux.fechaNacimiento,
                 edad: selectedAux.edad,
                 sexo: selectedAux.sexo,
                 estado: selectedAux.estado,
                 rol: selectedAux.rol

             });

             // Actualizar la lista de usuarios principal y la filtrada
             setUsuarios(usuarios.map(a =>
                 a.id === selectedAux.id ? selectedAux : a
             ));
             setUsuariosFiltrados(usuariosFiltrados.map(a =>
                 a.id === selectedAux.id ? selectedAux : a
             ));

             setShowModal(false);
             Swal.fire('Actualizado', 'Los datos fueron actualizados.', 'success');
         } catch (error) {
             console.error(error);
             Swal.fire('Error', 'No se pudo actualizar.', 'error');
         }
    };
    
    const handleModalChange = (e) => {
         const { name, value } = e.target;
    
         setSelectedAux((prev) => {
             const updated = { ...prev, [name]: value };
    
             if (name === 'fechaNacimiento') {
                 updated.edad = calcularEdad(value);
             }
    
             return updated;
         });
    };
    
    // Foto de usuario (si está logueado)
    const user = auth.currentUser;

    const getEstadoClase = (estado) => {
         switch ((estado || 'Pendiente').toLowerCase()) {
             case 'activo':
                 return 'bg-success1'; // Verde
             case 'inactivo':
                 return 'bg-danger1'; // Rojo
             case 'pendiente':
                 return 'bg-warning1'; // Amarillo
             default:
                 return 'bg-secondary1'; // Gris por defecto
         }
    };
    const getRol = (rol) => {
         switch ((rol || '').toLowerCase()) {
             case 'usuario':
                 return 'bg-primary'; 
             case 'admin':
                 return 'bg-dark'; 
             default:
                 return 'bg-secondary'; // Gris por defecto
         }
    };
    const calcularEdad = (fechaNacimiento) => {
         if (!fechaNacimiento) return '';
    
         const hoy = new Date();
         const fechaNac = new Date(fechaNacimiento);
    
         let edad = hoy.getFullYear() - fechaNac.getFullYear();
         const mes = hoy.getMonth() - fechaNac.getMonth();
         const dia = hoy.getDate() - fechaNac.getDate();
    
         if (mes < 0 || (mes === 0 && dia < 0)) {
             edad--;
         }
    
         return edad;
    };
    
    return (
        <>
            <NavBar/>
            <main className="main-content-dashboard bg-gradient2">
                <button type="button" className="btn-volver" onClick={() => navigate(-1)}>
                    &lt; Volver
                </button>
                <Container className="mt-5 ">
                    <div className="table-container">
                            <div className="header-tabla">
                                {/* Título e Ícono */}
                                <div className="nombre-tabla">
                                    <img src={IconoUsuario} width="44px" height="44px" />
                                    <h2>
                                        Usuarios
                                    </h2>
                                </div>
                                {/* Contador y Búsqueda */}
                                <div className="d-flex align-items-center">
                                    {/* Contador */}
                                    <div className="count-info2">
                                        <span className="count-number2">{usuariosFiltrados.length}</span> Usuarios Registrados
                                    </div>
                                </div>
                            </div>
                        <div className='header-tabla2'>
                             {/* Botón Nuevo */}
                            <Button variant="success" className="btn-nuevo" onClick={handleNuevo}>
                                <FaPlus className="plus-new"/> Nuevo
                            </Button>
                            {/* Búsqueda */}
                            <InputGroup className="search-input-group" style={{ maxWidth: '300px' }}>
                                <Form.Control
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="search-buscar"
                                />
                                <img 
                                    width="28px"
                                    height="28px"
                                    src={IconoBuscar}
                                    className='btn-icon-buscar'
                                />
                            </InputGroup>
                        </div>
                         
                        <Table striped bordered hover responsive className="tabla-auxiliares">
                             <thead>
                                 <tr>
                                     <th>Nombre Completo</th>
                                     <th>Teléfono</th>
                                     <th>Email</th>
                                     <th>Fecha Nacimiento</th>
                                     <th>Edad</th>
                                     <th>Sexo</th>
                                     <th>Estado</th>
                                     <th>Rol</th>
                                     <th>Acciones</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {usuariosFiltrados.map(aux => (
                                     <tr key={aux.id}>
                                         <td>{aux.nombreCompleto}</td>
                                         <td>{aux.telefono}</td>
                                         <td>{aux.email}</td>
                                         <td>{aux.fechaNacimiento || '-'}</td>
                                         <td>{aux.edad || '-'}</td>
                                         <td>{aux.sexo || '-'}</td>
                                         <td>
                                             <span className={`badge estado-badge ${getEstadoClase(aux.estado)}`}>
                                                 {aux.estado || 'Pendiente'}
                                             </span>
                                         </td>
                                         <td>
                                             <span className={`badge estado-badge ${getRol(aux.rol)}`}>
                                                 {aux.rol || 'usuario'}
                                             </span>
                                         </td>
                                         
                                         <td>
                                         
                                             <Button
                                                 variant="warning"
                                                 size="sm"
                                                 className="me-2"
                                                 onClick={() => handleEdit(aux)}
                                             >
                                                <img 
                                                src={IconoEditar} 
                                                alt="btn-editar" 
                                                width="30px"
                                                height="30px"
                                                />
                                             </Button>
                                             <Button
                                                 variant="danger"
                                                 size="sm"
                                                 onClick={() => handleEliminar(aux.id)}
                                             >
                                                <img 
                                                src={IconoEliminar} 
                                                alt="btn-eliminar"
                                                width="30px"
                                                height="30px"
                                                />
                                             </Button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                        </Table>
                    </div>
                </Container>
            </main>

            {/* MODAL EDICIÓN */}
             <Modal show={showModal} onHide={() => setShowModal(false)}>
                 <Modal.Header closeButton>
                     <Modal.Title>Editar Usuario</Modal.Title>
                 </Modal.Header>
                 <Modal.Body>
                     {selectedAux && (
                         <Form>
                             <Form.Group className="mb-2">
                                 <Form.Label>Nombres Completo</Form.Label>
                                 <Form.Control
                                     type="text"
                                     name="nombreCompleto"
                                     value={selectedAux.nombreCompleto}
                                     onChange={handleModalChange}
                                 />
                             </Form.Group>
                             <Form.Group className="mb-2">
                                 <Form.Label>Teléfono</Form.Label>
                                 <Form.Control
                                     type="text"
                                     name="telefono"
                                     value={selectedAux.telefono}
                                     onChange={handleModalChange}
                                 />
                             </Form.Group>
                             <Form.Group className="mb-2">
                                 <Form.Label>Email</Form.Label>
                                 <Form.Control
                                     type="email"
                                     name="email"
                                     value={selectedAux.email}
                                     disabled
                                 />
                             </Form.Group>
                             <Form.Group className="mb-2">
                                 <Form.Label>Fecha de Nacimiento</Form.Label>
                                 <Form.Control
                                     type="date"
                                     name="fechaNacimiento"
                                     value={selectedAux.fechaNacimiento || ''}
                                     onChange={handleModalChange}
                                 />
                             <Form.Group className="mb-2">
                                 <Form.Label>Edad</Form.Label>
                                 <Form.Control
                                     type="text"
                                     name="edad"
                                     value={selectedAux.edad}
                                     readOnly
                                 />
                             </Form.Group>
                             </Form.Group>
                             <Form.Group className="mb-2">
                                 <Form.Label>Sexo</Form.Label>
                                 <Form.Select
                                     name="sexo"
                                     value={selectedAux.sexo || ''}
                                     onChange={handleModalChange}
                                 >
                                     <option value="">Seleccionar</option>
                                     <option value="Masculino">Masculino</option>
                                     <option value="Femenino">Femenino</option>
                                     <option value="Indeciso">Prefiero no decirlo</option>
                                 </Form.Select>
                             </Form.Group>
                             <Form.Group className="mb-2">
                                 <Form.Label>Estado</Form.Label>
                                 <Form.Select
                                     name="estado"
                                     value={selectedAux.estado || 'Pendiente'}
                                     onChange={handleModalChange}
                                 >
                                     <option>Pendiente</option>
                                     <option>Activo</option>
                                     <option>Inactivo</option>
                                 </Form.Select>
                             </Form.Group>
                             <Form.Group className="mb-2">
                                 <Form.Label>Rol</Form.Label>
                                 <Form.Select
                                     name="rol"
                                     value={selectedAux.rol || 'usuario'}
                                     onChange={handleModalChange}
                                 >
                                     <option value="">Seleccionar</option>
                                     <option>Usuario</option>
                                     <option>Invitado</option>
                                     <option>Admin</option>
                                 </Form.Select>
                             </Form.Group>
                         </Form>
                     )}
                 </Modal.Body>
                 <Modal.Footer>
                     <Button variant="secondary" onClick={() => setShowModal(false)}>
                         Cancelar
                     </Button>
                     <Button variant="primary" onClick={handleSaveChanges}>
                         Guardar Cambios
                     </Button>
                 </Modal.Footer>
             </Modal>
            <Footer/>
        </>
    );
}
 
export default GestionUsuariosPage;