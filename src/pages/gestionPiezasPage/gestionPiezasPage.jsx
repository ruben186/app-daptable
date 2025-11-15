import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown, Table, Button, Form, Modal, Image, InputGroup } from 'react-bootstrap';
import { FaEdit, FaTrash, FaUserCircle, FaPlus, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import logo from '../../assets/logos/logoapp-daptable.jpeg';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';
import IconoEditar from '../../assets/Iconos/iconoEditar.png';
import IconoEliminar from '../../assets/Iconos/iconoEliminar.png';
import IconoPieza from '../../assets/Iconos/iconoPieza.png'; // Reemplazado por icono de Pieza

// -----------------------------------------------------------
// 💡 FUNCIÓN DE AYUDA CLAVE: APLANA DOCUMENTOS DE PIEZAS
// -----------------------------------------------------------
const flattenPiezas = (docs) => {
    let flattenedList = [];
    docs.forEach(doc => {
        const data = doc.data();
        const parentId = doc.id;
        const base = { id: parentId, nombre: data.nombre, marca: data.marca, modelo: data.modelo };

        if (Array.isArray(data.campos) && data.campos.length > 0) {
            data.campos.forEach((campoItem, index) => {
                flattenedList.push({
                    ...base,
                    parentId: parentId, // Usado para buscar en handleSaveChanges
                    campoIndex: index,  // Usado para actualizar el array 'campos'
                    campo: campoItem.campo || '-',
                    codigo: campoItem.codigo || '-',
                    codigoCompatibilidad: campoItem.codigoCompatibilidad || '-',
                });
            });
        } else {
            // Documentos de pieza sin campos, si aplica
            flattenedList.push({ ...base, parentId: parentId, campoIndex: 0, campo: '-', codigo: '-', codigoCompatibilidad: '-' });
        }
    });
    return flattenedList;
};

// -----------------------------------------------------------
// COMPONENTE PRINCIPAL DE GESTIÓN DE PIEZAS
// -----------------------------------------------------------
function GestionPiezasPage() {
    const navigate = useNavigate();
    const [piezas, setPiezas] = useState([]); // Antes: usuarios
    const [piezasFiltradas, setPiezasFiltradas] = useState([]); // Antes: usuariosFiltrados
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // Antes: selectedAux
    const [searchTerm, setSearchTerm] = useState('');

    // 1. OBTENCIÓN DE DATOS Y APLANAMIENTO
    useEffect(() => {
        const fetchPiezas = async () => {
            try {
                // Asumimos que las piezas están en la colección 'tablas'
                const querySnapshot = await getDocs(collection(db, 'tablas'));
                const data = querySnapshot.docs;
                const flattenedData = flattenPiezas(data);

                setPiezas(flattenedData);
                setPiezasFiltradas(flattenedData);
            } catch (error) {
                console.error("Error fetching piezas:", error);
            }
        };
        fetchPiezas();
    }, []);

    // Hook para manejar la lógica de búsqueda
    useEffect(() => {
    // 1. Limpiar y dividir el término de búsqueda en palabras clave
    const searchWords = searchTerm.toLowerCase().split(/\s+/)
        .filter(word => word.length > 0); // Ignorar espacios vacíos

    if (searchWords.length === 0) {
        setPiezasFiltradas(piezas);
        return;
    }

    const results = piezas.filter(item => {
        // 2. Crear una cadena única combinando todos los campos relevantes de la pieza
        const itemText = [
            item.nombre,
            item.marca,
            item.modelo,
            item.codigo,
            item.campo,
            item.codigoCompatibilidad
        ].join(' ').toLowerCase();

        // 3. Verificar si TODAS las palabras clave están presentes en el texto combinado
        return searchWords.every(word => itemText.includes(word));
    });
    
    setPiezasFiltradas(results);
}, [searchTerm, piezas]);
    // -----------------------------------------------------------
    // LÓGICA DE EDICIÓN
    // -----------------------------------------------------------
    const handleEditPieza = (item) => {
        // Establecer el selectedItem con los datos de la fila aplanada
        // Estos datos incluyen el índice de array (campoIndex) y el ID del padre (parentId)
        setSelectedItem({
            id: item.parentId, // ID del documento principal en Firestore
            parentId: item.parentId, 
            campoIndexToUpdate: item.campoIndex, // Índice dentro del array 'campos'
            nombre: item.nombre,
            marca: item.marca,
            modelo: item.modelo,
            // Los campos anidados se envían como un array de 1 elemento para facilitar el manejo del modal
            campos: [{ 
                campo: item.campo, 
                codigo: item.codigo, 
                codigoCompatibilidad: item.codigoCompatibilidad 
            }]
        });
        setShowModal(true);
    };

    // -----------------------------------------------------------
    // LÓGICA DE GUARDADO (LA SOLUCIÓN AL PROBLEMA)
    // -----------------------------------------------------------
    const handleSaveChangesPieza = async () => {
        if (!selectedItem || !selectedItem.id) return;
        
        // --- Validaciones (Simplificadas para el ejemplo) ---
        const updatedCampo = selectedItem.campos && selectedItem.campos[0];
        
        if (!selectedItem.nombre || !selectedItem.marca || !selectedItem.modelo || 
            !updatedCampo || !updatedCampo.campo || !updatedCampo.codigo) {
            Swal.fire({
                title: "Campos Incompletos", 
                text: "Todos los campos de la pieza (nombre, marca, modelo, campo, código) deben ser llenados.", 
                icon: "error", 
                background: '#052b27ff', 
                color: '#ffdfdfff', 
                confirmButtonColor: '#0b6860ff' 
            });
            return;
        }

        const indexToUpdate = selectedItem.campoIndexToUpdate;
        
        try {
            const piezaRef = doc(db, 'tablas', selectedItem.id);
            
            // 1. Obtener el documento actual de Firestore para obtener el array 'campos' completo
            const docSnap = await getDoc(piezaRef);
            if (!docSnap.exists()) {
                throw new Error("El documento de la pieza no existe.");
            }
            const currentData = docSnap.data();
            const existingCampos = Array.isArray(currentData.campos) ? currentData.campos : [];

            // 2. Crear el array de campos actualizado
            const newCampos = [...existingCampos];
            
            // 3. Actualizar el elemento en el índice correcto
            if (indexToUpdate >= 0 && indexToUpdate < newCampos.length) {
                newCampos[indexToUpdate] = updatedCampo; // updatedCampo es selectedItem.campos[0]
            } else {
                Swal.fire({ title:'Error', text: "Índice de campo no válido. No se pudo actualizar.", icon: 'error', background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff' });
                return;
            }

            // 4. Objeto final a actualizar en Firebase
            const dataToUpdate = {
                nombre: selectedItem.nombre,
                marca: selectedItem.marca,
                modelo: selectedItem.modelo,
                campos: newCampos, // Guardamos el array completo y corregido
            };

            await updateDoc(piezaRef, dataToUpdate);

            // 💡 SOLUCIÓN: ACTUALIZACIÓN DEL ESTADO LOCAL DE PIEZAS
            setPiezas(prevPiezas => prevPiezas.map(p => {
                // Verifica si la fila pertenece al documento que estamos editando
                if (p.parentId === selectedItem.id) {
                    
                    // Actualiza los campos de nivel superior para TODAS las filas de este documento
                    let updatedRow = { 
                        ...p, 
                        nombre: dataToUpdate.nombre, 
                        marca: dataToUpdate.marca, 
                        modelo: dataToUpdate.modelo 
                    };
                    
                    // Si esta es la fila específica que editamos (por su índice de array)
                    if (p.campoIndex === indexToUpdate) {
                        // Actualiza también los campos anidados de ESA fila
                        updatedRow = {
                            ...updatedRow,
                            campo: updatedCampo.campo,
                            codigo: updatedCampo.codigo,
                            codigoCompatibilidad: updatedCampo.codigoCompatibilidad,
                        };
                    }
                    return updatedRow;
                }
                return p; // Deja las otras piezas sin cambios
            }));
            // 💡 FIN de la actualización de estado local.

            setShowModal(false);
            Swal.fire({
                title:'Actualizado', 
                text: 'Los datos de la pieza y sus campos fueron actualizados.', 
                icon: 'success',
                background: '#052b27ff',
                color: '#ffdfdfff',
                confirmButtonColor: '#0b6860ff'
            });
            
        } catch (error) {
            console.error("Error al guardar cambios de pieza:", error);
            Swal.fire({ title:'Error', text: `No se pudo actualizar la pieza: ${error.message}`, icon: 'error', background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff' });
        }
    };
    
    // Función para manejar los cambios del modal
    const handleModalChange = (e) => {
        const { name, value } = e.target;
    
        setSelectedItem((prev) => {
            let updated = { ...prev };

            // Si se cambia un campo de nivel superior
            if (['nombre', 'marca', 'modelo'].includes(name)) {
                updated = { ...updated, [name]: value };
            } else {
                // Si se cambia un campo anidado
                updated = {
                    ...updated,
                    campos: [{ 
                        ...prev.campos[0], 
                        [name]: value 
                    }]
                };
            }
            return updated;
        });
    };
    
    const handleSearch = (e) => setSearchTerm(e.target.value);
    const handleNuevo = () => navigate('/TablaCel'); 
    const handleEliminar = async (id) => {  
        const result = await Swal.fire({
            title:"¿Estás Seguro?", 
            text: "¡Esto eliminara el registro del telefono y sus piezas!", 
            icon: "warning",
            showCancelButton: true,
            background: '#052b27ff',
            color: '#ffdfdfff',
            confirmButtonColor: '#07433E',
            cancelButtonColor: 'rgba(197, 81, 35, 1)',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, 'tablas', id)); // Asumiendo que las Piezas están en la colección 'tablas'
                setPiezas(piezas.filter(p => p.id !== id));
                Swal.fire({
                    title: 'Eliminado', 
                    text: 'Registro de pieza eliminado correctamente.', 
                    icon: 'success',
                    background: '#052b27ff',
                    color: '#ffdfdfff',
                    confirmButtonColor: '#0b6860ff'
                });
            } catch (error) {
                console.error("Error al eliminar pieza:", error);
                Swal.fire({
                    title:"Error", 
                    text: "No se pudo eliminar el registro de pieza.", 
                    icon: "error",
                    background: '#052b27ff',
                    color: '#ffdfdfff',
                    confirmButtonColor: '#0b6860ff',
                });
            }
        }
    }; 

    // --- JSX ---
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
                            <div className="nombre-tabla">
                                <img src={IconoPieza} width="44px" height="44px" />
                                <h2>Celulares y Partes</h2>
                            </div>
                            <div className="d-flex align-items-center">
                                <div className="count-info2">
                                    <span className="count-number2">{piezasFiltradas.length}</span> Piezas Registradas
                                </div>
                            </div>
                        </div>
                        <div className='header-tabla2'>
                            <Button variant="success" className="btn-nuevo" title='Ingresar nuevo Celular' onClick={handleNuevo}>
                                <FaPlus className="plus-new" /> Nuevo
                            </Button>
                            <InputGroup className="search-input-group" style={{ maxWidth: '300px' }}>
                                <Form.Control
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="search-buscar"
                                />
                                <img width="28px" height="28px" src={IconoBuscar} className='btn-icon-buscar' />
                            </InputGroup>
                        </div>
                          
                        <Table striped bordered hover responsive className="tabla-auxiliares">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Marca</th>
                                    <th>Modelo</th>
                                    <th>Pieza</th>
                                    <th>Código</th>
                                    <th>Cód. Compatibilidad</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {piezasFiltradas.map((item) => (
                                    <tr key={`${item.parentId}-${item.campoIndex}`}>
                                        <td>{item.nombre}</td>
                                        <td>{item.marca}</td>
                                        <td>{item.modelo}</td>
                                        <td>{item.campo}</td>
                                        <td>{item.codigo}</td>
                                        <td>{item.codigoCompatibilidad}</td>
                                        <td>
                                            <Button
                                                variant="warning"
                                                size="sm"
                                                title='Editar pieza'
                                                className="me-2"
                                                onClick={() => handleEditPieza(item)}
                                            >
                                                <img src={IconoEditar} alt="btn-editar" width="30px" height="30px" />
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                title='Eliminar datos completos del celular'
                                                onClick={() => handleEliminar(item.parentId)}
                                            >
                                                <img src={IconoEliminar} alt="btn-eliminar" width="30px" height="30px" />
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
                    <Modal.Title>Editar Pieza</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedItem && selectedItem.campos && selectedItem.campos[0] && (
                         <Form>
                            {/* Nombre */}
                            <Form.Group className="mb-2">
                                <Form.Label>Nombre de la Pieza</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="nombre"
                                    value={selectedItem.nombre || ''}
                                    onChange={handleModalChange}
                                />
                            </Form.Group>
                            {/* Campo */}
                            <Form.Group className="mb-2">
                                <Form.Label>Pieza</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="campo"
                                    value={selectedItem.campos[0].campo || ''}
                                    onChange={handleModalChange}
                                />
                            </Form.Group>
                            {/* Código */}
                            <Form.Group className="mb-2">
                                <Form.Label>Código de Pieza</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="codigo"
                                    value={selectedItem.campos[0].codigo || ''}
                                    onChange={handleModalChange}
                                    disabled
                                />
                            </Form.Group>
                            {/* Código Compatibilidad */}
                            <Form.Group className="mb-2">
                                <Form.Label>Código Compatibilidad</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="codigoCompatibilidad"
                                    value={selectedItem.campos[0].codigoCompatibilidad || ''}
                                    onChange={handleModalChange}
                                />
                            </Form.Group>
                            {/* Marca */}
                            <Form.Group className="mb-2">
                                <Form.Label>Marca</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="marca"
                                    value={selectedItem.marca || ''}
                                    onChange={handleModalChange}
                                    disabled
                                />
                            </Form.Group>
                            {/* Modelo */}
                            <Form.Group className="mb-2">
                                <Form.Label>Modelo</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="modelo"
                                    value={selectedItem.modelo || ''}
                                    onChange={handleModalChange}
                                />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSaveChangesPieza}>
                        Guardar Cambios
                    </Button>
                </Modal.Footer>
            </Modal>
            <Footer/>
        </>
    );
}

export default GestionPiezasPage;