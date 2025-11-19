import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Navbar, Container, NavDropdown, Table, Button, Form, Modal, Image, InputGroup } from 'react-bootstrap';
import { FaEdit, FaTrash, FaUserCircle, FaPlus, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import './xiaomi.css';
import logo from '../../assets/logos/logoapp-daptable.jpeg';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';
import IconoPantallaV from '../../assets/Iconos/iconoPantallaVerde.png';
import IconoPantallaR from '../../assets/Iconos/iconoPantallaRojo.png';
import IconoBateriaR from '../../assets/Iconos/IconoBateriaR3.png';
import IconoBateriaV from '../../assets/Iconos/IconoBateriaV.png';
import IconoFlexBotonesV from '../../assets/Iconos/flexBotonesV.png';
import IconoFlexBotonesR from '../../assets/Iconos/flexBotonesR.png';
import IconoPiezaA from '../../assets/Iconos/IconoPiezaA.png';
import IconologoXiami from '../../assets/logos/logoxiaomiverde2.png';


function Xiaomi() {
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
                    const codigoCompatibilidad = user.codigoCompatibilidad?.toLowerCase();
                    return marca === 'redmi' || marca === 'xiaomi' || marca === '-' || codigoCompatibilidad === 'bn56' || codigoCompatibilidad === '-';
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
    }, [searchTerm, usuarios]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };





    

    const handleSaveChanges = async () => {
        try {
            const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
            const soloNumeros = /^[0-9]+$/;
            if (selectedAux.nombre === '' || selectedAux.Modelo === '') {
                return;
            }


            // --- ⬇️ COLOQUE LA FUNCIÓN getIconoEstado AQUÍ ⬇️ ---

    const getIconoEstado = (tipoPieza, aux) => {
        let pieza;

        switch (tipoPieza) {
            case 'pantalla':
                // Nota: Asegúrate de que 'aux.pantalla' sea la propiedad correcta
                // que contiene el objeto con 'codigoCompatibilidad'.
                pieza = aux.pantalla; 
                break;
            case 'bateria':
                pieza = aux.bateria;
                break;
            case 'flexBotones':
                pieza = aux.flexBotones;
                break;
            default:
                return IconoPiezaA;
        }

        // Comprobación segura y concisa: 
        const codigo = pieza?.codigoCompatibilidad ?? '';
        const tieneCompatibilidad = codigo !== '';

        // Asignación de ícono
        if (tipoPieza === 'pantalla') {
            return tieneCompatibilidad ? IconoPantallaV : IconoPantallaR;
        }
        if (tipoPieza === 'bateria') {
            return tieneCompatibilidad ? IconoBateriaV : IconoBateriaR;
        }
        if (tipoPieza === 'flexBotones') {
            return tieneCompatibilidad ? IconoFlexBotonesV : IconoFlexBotonesR;
        }

        return IconoPiezaA;
    };

    // --- ⬆️ FUNCIÓN getIconoEstado TERMINA AQUÍ ⬆️ ---
            const auxRef = doc(db, 'tablas', selectedAux.id);
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

    // --- NUEVA FUNCIÓN PARA EL CLIC DEL BOTÓN/IMAGEN ---
    const handleIconClick = (tipoPieza, aux) => {
        // 'tipoPieza' será 'pantalla', 'bateria' o 'flexBotones'
        // 'aux' contiene los datos de la fila (el dispositivo)
        
        // Aquí puedes ejecutar la acción que necesites, por ejemplo:
        // 1. Mostrar un SweetAlert con la información específica:
        Swal.fire({
            title: `${tipoPieza.toUpperCase()} - ${aux.nombre} ${aux.modelo}`,
            text: `Hiciste clic en el ícono de ${tipoPieza}. Aquí puedes mostrar
                   la información de compatibilidad o llevar al usuario a otra página.`,
            icon: 'info',
            confirmButtonText: 'Cerrar'
        });

        // 2. Navegar a una ruta con los detalles (si tienes una ruta):
        // navigate(`/detalles/${aux.id}/${tipoPieza}`);

        console.log(`Clic en ${tipoPieza} para el dispositivo: ${aux.nombre}`);
    };

    // Foto de usuario (si está logueado)
    const user = auth.currentUser;

    return (
        <>
            <NavBar />
            <main className="main-content-dashboard bg-gradient2">

                <Container className="mt-5 ">
                    <div className="table-container">
                        <div className="header-tabla">
                            {/* Título e Ícono */}

                            {/* Contador y Búsqueda */}
                            <div className="d-flex align-items-center">

                            </div>
                        </div>
                        <div className='header-tabla2'>

                            <div className="nombre-tabla">
                                
                                <img src={IconologoXiami}className='mover-logo-xiaomi' width="54px" height="54px" alt="Logo de la aplicación" />
                                < h5 className='texto-separado'>

                                    si un icono es <span style={{ color: 'red' }}>rojo</span> quiere decir que por el momento no hay informacion de Compatibilidad
                                </h5>

                            </div>

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
                                alt="Logo de la aplicación"/>
                            </InputGroup>
                        </div>

                        <Table striped bordered hover responsive className="tabla-auxiliares">
                            <thead>
                                <tr>
                                    <th>Nombre </th>
                                    <th>Modelo</th>
                                    <th>Pantalla</th>
                                    <th>Bateria</th>
                                    <th>Flex Botones</th>
                                    <th>Mas</th>

                                </tr>
                            </thead>
                            <tbody>
                                {usuariosFiltrados.map(aux => (
                                    <tr key={aux.id}>
                                        <td>{aux.nombre}</td>
                                        <td>{aux.modelo}</td>

                                        {/* Columna Pantalla - Implementación como botón */}
                                        <td style={{ textAlign: 'center' }}>
                                            {/* Usamos Button para que actúe como botón */}
                                            <Button
                                                variant="link" // Usa variant="link" para quitar el fondo del botón de Bootstrap
                                                onClick={() => handleIconClick('pantalla', aux)}
                                                className="p-0 border-0" // Quita padding y borde del botón
                                            >
                                                <img
                                                    src={IconoPantallaV} 
                                                    width="22x" 
                                                    height="34px" 
                                                    alt="Ícono de Pantalla"
                                                />
                                            </Button>
                                        </td>

                                        {/* Columna Bateria - Implementación como botón */}
                                        <td style={{ textAlign: 'center' }}>
                                            <Button
                                                variant="link" 
                                                onClick={() => handleIconClick('bateria', aux)}
                                                className="p-0 border-0"
                                            >
                                                <img
                                                    src={IconoBateriaR} 
                                                    width="24px" 
                                                    height="34px" 
                                                    alt="Ícono de Batería" 
                                                />
                                            </Button>
                                        </td>
                                        
                                        {/* Columna Flex Botones - Implementación como botón */}
                                        <td style={{ textAlign: 'center' }}>
                                            <Button
                                                variant="link" 
                                                onClick={() => handleIconClick('flexBotones', aux)}
                                                className="p-0 border-0"
                                            >
                                                <img
                                                    src={IconoFlexBotonesV} 
                                                    width="34px" 
                                                    height="34px" 
                                                    alt="Ícono de Flex de Botones"
                                                />
                                            </Button>
                                        </td>
                                        
                                        {/* Columna Más (sin cambios, solo por si también quieres que sea botón) */}
                                        <td style={{ textAlign: 'center' }}>
                                            <Button
                                                variant="link" 
                                                onClick={() => handleIconClick('mas', aux)}
                                                className="p-0 border-0"
                                            >
                                                <img 
                                                    src={IconoPiezaA} 
                                                    width="34px" 
                                                    height="34px" 
                                                    alt="Ícono Más" 
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

            <Footer />
        </>
    );
}

export default Xiaomi;