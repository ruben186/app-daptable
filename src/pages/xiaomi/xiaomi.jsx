import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Navbar, Container, NavDropdown, Table, Button, Form, Modal, Image, InputGroup } from 'react-bootstrap';
import { FaEdit, FaTrash, FaUserCircle, FaPlus, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
//import './registroUsuarioPage.css';
import logo from '../../assets/logos/logoapp-daptable.jpeg';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';
import IconoEditar from '../../assets/Iconos/iconoEditar.png';
import IconoEliminar from '../../assets/Iconos/iconoEliminar.png';
import IconoUsuario from '../../assets/Iconos/usuario2.png';
import IconologoXiami from '../../assets/logos/logoxiaomiverde2.png';


function Xiaomi(){
    const navigate = useNavigate(); // Añadir useNavigate
    const [usuarios, setUsuarios] = useState([]);
    const [usuariosFiltrados, setUsuariosFiltrados] = useState([]); // Nuevo estado para usuarios filtrados
    const [showModal, setShowModal] = useState(false);
    const [selectedAux, setSelectedAux] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Nuevo estado para la búsqueda

    useEffect(() => {
       const fetchUsuarios = async () => {
         const querySnapshot = await getDocs(collection(db, 'tablas'));
         const data = querySnapshot.docs
            .map(doc => ({
            id: doc.id,
            ...doc.data()
            }))
            .filter(user => {
            const marca = user.marca?.toLowerCase();
            return marca === 'redmi' || marca === 'xiaomi'  || marca === '-';
            });

         setUsuarios(data);
         setUsuariosFiltrados(data); // Inicialmente, filtrados es igual a todos
        };
        fetchUsuarios();  
    }, []);

    // Hook para manejar la lógica de búsqueda
    useEffect(() => {
        const results = usuarios.filter(user => 
            user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) 
          
        );
        setUsuariosFiltrados(results);
    }, [searchTerm, usuarios]); // Se ejecuta cuando cambia el término de búsqueda o la lista original de usuarios
    
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleNuevo = () => {
        // Asumiendo que tienes una ruta para crear un nuevo usuario
        // Reemplaza '/crear-usuario' con tu ruta real si es diferente
        navigate('/crear-usuario'); 
    };

   

    const handleSaveChanges = async () => {
         try {
             const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
             const soloNumeros = /^[0-9]+$/;
             if(selectedAux.nombre=== '' || selectedAux.Modelo        === '' 
                ){
               
                     return;
                 }
                 
                 
                 
             
             const auxRef = doc(db, 'tablas',  selectedAux.id);
             await updateDoc(auxRef, {
                 nombreCompleto: selectedAux.nombre,
                 modelo: selectedAux.modelo,
                
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
                         
                        <Table striped bordered hover responsive className="tablas">
                             <thead>
                                 <tr>
                                     <th>Nombre </th>
                                     <th>Modelo</th>
                                      <th>Pantalla</th>
                                     <th>Bateria</th>
                                     <th>Flex Botones</th>
                                    <th>Otros</th>
                                    
                                 </tr>
                             </thead>
                             <tbody>
                                 {usuariosFiltrados.map(aux => (
                                     <tr key={aux.id}>
                                         <td>{aux.nombre}</td>
                                         <td>{aux.modelo}</td>
                                         
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
                                             <span className={`badge estado-badge ${getRol(aux.rol)}`}>
                                                 {aux.rol || 'pantalla'}
                                             </span>
                                         </td>


                                         <td>
                                         
                                            
                                             
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
                     <Modal.Title>Editar Auxiliar</Modal.Title>
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
 
export default Xiaomi;