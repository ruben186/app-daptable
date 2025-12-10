import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Container,Table, Button, Form, Modal, InputGroup } from 'react-bootstrap';
import { FaPlus} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { db } from '../../firebase';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';
import IconoEditar from '../../assets/Iconos/iconoEditar.png';
import IconoEliminar from '../../assets/Iconos/iconoEliminar.png';
import IconoPieza from '../../assets/Iconos/iconoPieza.png'; 

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
                    parentId: parentId,
                    campoIndex: index, 
                    campo: campoItem.campo || '-',
                    codigo: campoItem.codigo || '-',
                    codigoCompatibilidad: campoItem.codigoCompatibilidad || '-',
                });
            });
        } else {
            flattenedList.push({ ...base, parentId: parentId, campoIndex: 0, campo: '-', codigo: '-', codigoCompatibilidad: '-' });
        }
    });
    return flattenedList;
};

function GestionPiezasPage() {
    const navigate = useNavigate();
    const [piezas, setPiezas] = useState([]); 
    const [piezasFiltradas, setPiezasFiltradas] = useState([]); 
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); 
    const [searchTerm, setSearchTerm] = useState('');

    // obtener datos de Celulares y piezas
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

    useEffect(() => {
        const searchWords = searchTerm.toLowerCase().split(/\s+/)
            .filter(word => word.length > 0); // Ignorar espacios vacíos

        if (searchWords.length === 0) {
            setPiezasFiltradas(piezas);
            return;
        }

        const results = piezas.filter(item => {
            const itemText = [
                item.nombre,
                item.marca,
                item.modelo,
                item.codigo,
                item.campo,
                item.codigoCompatibilidad
            ].join(' ').toLowerCase();

            return searchWords.every(word => itemText.includes(word));
        });
    
        setPiezasFiltradas(results);
    }, [searchTerm, piezas]);
  
    const handleEditPieza = (item) => {
        const nombreCelular = item.nombre || ''; 
        const modelo = item.modelo || '';     
        const combinedQuery = `${nombreCelular} ${modelo}`.trim();

        if (combinedQuery) {
            const queryTerm = encodeURIComponent(combinedQuery);
            navigate(`/TablaCel?query=${queryTerm}`);
        } else {
            console.error("No se pudo generar la cadena de búsqueda combinada.");
            return;
        }
       
    };

    const handleSaveChangesPieza = async () => {
        if (!selectedItem || !selectedItem.id) return;
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
            
            const docSnap = await getDoc(piezaRef);
            if (!docSnap.exists()) {
                throw new Error("El documento de la pieza no existe.");
            }
            const currentData = docSnap.data();
            const existingCampos = Array.isArray(currentData.campos) ? currentData.campos : [];

            const newCampos = [...existingCampos];
            
            if (indexToUpdate >= 0 && indexToUpdate < newCampos.length) {
                newCampos[indexToUpdate] = updatedCampo;
            } else {
                Swal.fire({ title:'Error', text: "Índice de campo no válido. No se pudo actualizar.", icon: 'error', background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff' });
                return;
            }

            // Actualizar en Firebase
            const dataToUpdate = {
                nombre: selectedItem.nombre,
                marca: selectedItem.marca,
                modelo: selectedItem.modelo,
                campos: newCampos, 
            };

            await updateDoc(piezaRef, dataToUpdate);

            setPiezas(prevPiezas => prevPiezas.map(p => {
                if (p.parentId === selectedItem.id) {
                    let updatedRow = { 
                        ...p, 
                        nombre: dataToUpdate.nombre, 
                        marca: dataToUpdate.marca, 
                        modelo: dataToUpdate.modelo 
                    };
                    
                    if (p.campoIndex === indexToUpdate) {
                        updatedRow = {
                            ...updatedRow,
                            campo: updatedCampo.campo,
                            codigo: updatedCampo.codigo,
                            codigoCompatibilidad: updatedCampo.codigoCompatibilidad,
                        };
                    }
                    return updatedRow;
                }
                return p;
            }));

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
    
    const handleModalChange = (e) => {
        const { name, value } = e.target;
    
        setSelectedItem((prev) => {
            let updated = { ...prev };

            if (['nombre', 'marca', 'modelo'].includes(name)) {
                updated = { ...updated, [name]: value };
            } else {
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
                await deleteDoc(doc(db, 'tablas', id)); 
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

    const exportToCSV = (rowsToExport) => {
        const rows = rowsToExport; 
        if (!rows.length) {
            alert('No hay filas para exportar');
            return;
        }

        const headers = ['Nombre', 'Modelo', 'Marca', 'Pieza', 'Codigo', 'Codigo compatibilidad'];
        const csvLines = [];
        csvLines.push(headers.join(';'));
        
        rows.forEach((r) => {
            const safe = (s) => `"${(s || '').toString().replace(/"/g, '""')}"`;
            csvLines.push([
                safe(r.nombre), 
                safe(r.modelo), 
                safe(r.marca), 
                safe(r.campo), 
                safe(r.codigo), 
                safe(r.codigoCompatibilidad || '')
            ].join(';'));
        });

        const csvContent = csvLines.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const baseName = searchTerm ? `piezas_${searchTerm.replace(/\s+/g, '_')}` : 'piezas_completas';
        a.download = `${baseName}_export.csv`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <NavBar/>
            <main className="main-content-dashboard bg-gradient2">
                <Container className="mt-5 ">
                    <div className="table-container">
                        <div className="header-tabla">
                            <div className="nombre-tabla">
                                <img src={IconoPieza} alt='Pieza' width="44px" height="44px" />
                                <h2>Celulares y Partes</h2>
                            </div>
                        </div>
                        <div className='header-tabla2'>
                            <Button variant="success" className="btn-nuevo" title='Ingresar nuevo Celular' onClick={handleNuevo}>
                                <FaPlus className="plus-new" /> Nuevo
                            </Button>
                            <Button className="btn-success exportar-btn" onClick={()=> exportToCSV(piezasFiltradas)}>
                                Exportar CSV
                            </Button>
                            <button type="button" className="btn-volver" onClick={() => navigate(-1)}>
                                Volver
                            </button>
                            <InputGroup className="search-input-group" style={{ maxWidth: '300px' }}>
                                <Form.Control
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="search-buscar"
                                />
                                <img width="28px" height="28px" alt='lupa' src={IconoBuscar} className='btn-icon-buscar' />
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
                            <Form.Group className="mb-2">
                                <Form.Label>Nombre de la Pieza</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="nombre"
                                    spellCheck='true'
                                    value={selectedItem.nombre || ''}
                                    onChange={handleModalChange}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Pieza</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="campo"
                                    spellCheck='true'
                                    value={selectedItem.campos[0].campo || ''}
                                    onChange={handleModalChange}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Código de Pieza</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="codigo"
                                    spellCheck='true'
                                    value={selectedItem.campos[0].codigo || ''}
                                    onChange={handleModalChange}
                                    disabled
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Código Compatibilidad</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="codigoCompatibilidad"
                                    value={selectedItem.campos[0].codigoCompatibilidad || ''}
                                    onChange={handleModalChange}
                                />
                            </Form.Group>
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