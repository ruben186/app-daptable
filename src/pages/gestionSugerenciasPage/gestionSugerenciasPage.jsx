import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, where, documentId } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { Container, Table, Button, Form, Modal, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { db } from '../../firebase'; 
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';
import IconoRevisar from '../../assets/Iconos/iconoEditar.png'; 
import IconoEliminar from '../../assets/Iconos/iconoEliminar.png';
import IconoSugerencia from '../../assets/Iconos/iconoPieza.png'; 
import './gestionSugerenciasPage.css';

const formatFecha = (timestamp) => {
    if (!timestamp) return 'N/A';
    let dateValue;

    // Adaptación para manejar diferentes formatos de timestamp de Firebase/JS Date
    if (timestamp && timestamp.seconds !== undefined) {
          dateValue = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
        dateValue = timestamp;
    } else if (typeof timestamp === 'string' && !isNaN(Date.parse(timestamp))) {
        dateValue = new Date(timestamp);
    } else {
        // Manejar strings de Firebase como 'Timestamp(seconds=...)' si el timestamp original falla
        if (typeof timestamp === 'string' && timestamp.startsWith('Timestamp(seconds=')) {
            const match = timestamp.match(/seconds=(\d+)/); 
            if (match && match[1]) {
                const seconds = parseInt(match[1], 10);
                dateValue = new Date(seconds * 1000); 
            }
        }
    }

    if (dateValue && !isNaN(dateValue.getTime())) {
        return dateValue.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    return String(timestamp);
};

const ModalSugerencias = ({ show, handleClose, sugerencia, refreshTable, piezasNombre, marcaNames }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (sugerencia) {
            setFormData({
                id: sugerencia.id,
                // Datos del Sugerente 
                nombreUsuario: sugerencia.nombreUsuario || '', 
                emailUsuario: sugerencia.emailUsuario || '',
                
                // Campos Editables 
                nombreCelular: sugerencia.nombreCelular || '',
                pieza: sugerencia.pieza || '',
                marcaOriginal: sugerencia.marca || '',
                modeloOriginal: sugerencia.modelo || '',
                marcaAdaptable: sugerencia.adaptableMarca || '',
                modeloAdaptable: sugerencia.adaptableModelo || '',

                comentarios: sugerencia.comentarios || '',
                estado: sugerencia.estado || 'Pendiente'
            });
        }
    }, [sugerencia]);

    // Función para manejar la actualización de datos en el modal
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    // Función para manejar el guardado de los cambios (edición)
    const handleGuardarCambios = async (e) => {
        const requiredFields = [
            { name: 'estado', label: 'Estado', minLength: 1 },
            { name: 'nombreCelular', label: 'Nombre Celular', minLength: 3 },
            { name: 'marcaOriginal', label: 'Marca (Origen)', minLength: 2 },
            { name: 'modeloOriginal', label: 'Modelo (Origen)', minLength: 1 },
            { name: 'pieza', label: 'Pieza', minLength: 3 },
            { name: 'marcaAdaptable', label: 'Marca (Adaptable)', minLength: 2 },
            { name: 'modeloAdaptable', label: 'Modelo (Adaptable)', minLength: 1 },
        ];

        let missingFields = [];

        requiredFields.forEach(field => {
            const value = formData[field.name] ? String(formData[field.name]).trim() : '';
            
            // Criterio de "vacío" o "seleccionar"
            if (!value || value === 'Seleccionar' || value === 'Otro' || value.length < field.minLength) {
                missingFields.push(field.label);
            }
        });

        // Detener si hay campos faltantes/inválidos
        if (missingFields.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos Incompletos',
                text: `Por favor, llenar todos los campos necesarios`, 
                background: '#052b27ff', 
                color: '#ffdfdfff', 
                confirmButtonColor: '#0b6860ff'
            });
            
            return; // Detiene la ejecución
        }
        try {
            await updateDoc(doc(db, 'sugerenciasPiezas', formData.id), {
                nombreCelular: formData.nombreCelular,
                pieza: formData.pieza,
                marca: formData.marcaOriginal,
                modelo: formData.modeloOriginal, 
                adaptableMarca: formData.marcaAdaptable, 
                adaptableModelo: formData.modeloAdaptable,
                estado: formData.estado, 
                fechaEdicion: new Date(), 
            });
            Swal.fire({
                title: '¡Guardado!',
                text: 'Sugerencia actualizada y lista para procesamiento.',
                icon: 'success',
                background: '#052b27ff',
                color: '#ffff',
                confirmButtonColor: '#07433E'
            });

            handleClose();
            refreshTable(); 
        } catch (error) {
            console.error("Error al guardar cambios de sugerencia:", error);
            Swal.fire('Error', 'Hubo un problema al guardar los cambios.', 'error');
        } 
    };
    
    if (!sugerencia) return null;
    // Lógica para Pieza Original (para select y input condicional)
    const pieceOptions = piezasNombre || [];
    const isRegisteredPiece = pieceOptions.some(p => p === formData.pieza);
    const isCustomPiece = formData.pieza && formData.pieza !== 'Seleccionar' && formData.pieza !== 'Otro' && !isRegisteredPiece;
    const selectPieceValue = isCustomPiece ? 'Otro' : (formData.pieza || 'Seleccionar');

    // Lógica para Marca Original (para select y input condicional)
    const marcaOptions = marcaNames || []; 
    const isRegisteredMarca = marcaOptions.some(m => m === formData.marcaOriginal);
    const isCustomMarca = formData.marcaOriginal && formData.marcaOriginal !== 'Seleccionar' && formData.marcaOriginal !== 'Otro' && !isRegisteredMarca;
    const selectMarcaValue = isCustomMarca ? 'Otro' : (formData.marcaOriginal || 'Seleccionar');

    // Lógica para Marca Adaptable (para select y input condicional)
    const isRegisteredAdaptableMarca = marcaOptions.some(m => m === formData.marcaAdaptable);
    const isCustomAdaptableMarca = formData.marcaAdaptable && formData.marcaAdaptable !== 'Seleccionar' && formData.marcaAdaptable !== 'Otro' && !isRegisteredAdaptableMarca;
    const selectAdaptableMarcaValue = isCustomAdaptableMarca ? 'Otro' : (formData.marcaAdaptable || 'Seleccionar');
    const fechaFormateada = formatFecha(sugerencia.fechaSugerencia);

    const renderGestionSugerenciasModalBody = () => (
        <Form>
            {/* Detalles de la Sugerencia (Solo Lectura) */}
            <h6 className="mt-3 mb-2 ">Detalles del Registro</h6>
            <div className="d-flex justify-content-between mb-3">
                <Form.Group className="mb-2 w-50 pe-2">
                    <Form.Label >Sugerencia Por:</Form.Label>
                    <Form.Control 
                        type="text" 
                        value={formData.nombreUsuario || ''} 
                        disabled 
                    />
                </Form.Group>
                <Form.Group className="mb-2 w-50 ps-2">
                    <Form.Label>Fecha Sugerencia</Form.Label>
                    <Form.Control 
                        type="text" 
                        value={fechaFormateada} 
                        disabled
                    />
                </Form.Group>
            </div>
            {/* Comentarios del Sugerente (Solo Lectura) */}
            <Form.Group className="mb-2 ">
                <Form.Label >Comentarios del Sugerente</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={3}
                    name="comentarios"
                    value={formData.comentarios || ''}
                    disabled
                />
            </Form.Group>
            
            <hr/>
            <h6 className="mt-3 mb-2 ">Datos Editables de la pieza sugerida</h6>

            {/* Estado */}
            <Form.Group className="mb-2">
                <Form.Label>Estado</Form.Label>
                <Form.Select
                    name="estado"
                    value={formData.estado || 'Pendiente'}
                    onChange={handleInputChange} 
                >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aceptado">Aceptado</option>
                    <option value="Rechazado">Rechazado</option>
                    <option value="En Revisión">En Revisión</option>
                </Form.Select>
            </Form.Group>

            {/* Nombre Celular y Marca (Original) */}
            <div className="d-flex justify-content-between">
                <Form.Group className="mb-2 w-50 pe-2">
                    <Form.Label>Nombre Celular</Form.Label>
                    <Form.Control
                        type="text"
                        name="nombreCelular"
                        value={formData.nombreCelular || ''}
                        onChange={handleInputChange}
                    />
                </Form.Group>
               
                
                <Form.Group className="mb-2 w-50 ps-2">
                    <Form.Label>Marca</Form.Label>
                    <Form.Select
                        name="marcaOriginal" 
                        value={selectMarcaValue} 
                        onChange={handleInputChange}
                    >
                        <option value="Seleccionar">Seleccionar</option>
                        {marcaOptions.map((marcaName, index) => (
                            <option key={`m-o-${index}`} value={marcaName}>
                                {marcaName}
                            </option>
                        ))}
                        <option value="Otro">Otro</option>
                    </Form.Select>

                    {(selectMarcaValue === 'Otro' || isCustomMarca) && (
                        <Form.Control
                            className="mt-2"
                            type="text"
                            name="marcaOriginal"
                            value={formData.marcaOriginal === 'Otro' ? '' : formData.marcaOriginal || ''}
                            placeholder="Escriba la marca aqui"
                            onChange={handleInputChange}
                        />
                    )}
                </Form.Group>
            </div>
            
            {/* Pieza (Original) y Modelo ya movido arriba */}
            <div className="d-flex justify-content-between">
                 <Form.Group className="mb-2 w-50 pe-2">
                    <Form.Label >Modelo</Form.Label>
                    <Form.Control
                        type="text"
                        name="modeloOriginal" 
                        value={formData.modeloOriginal || ''}
                        onChange={handleInputChange}
                    />
                </Form.Group>
                <Form.Group className="mb-2 w-50 ps-2">
                    <Form.Label >Pieza</Form.Label>
                    <Form.Select
                        name="pieza"
                        value={selectPieceValue} 
                        onChange={handleInputChange}
                        className="input-custom-admin"
                    >
                        <option value="Seleccionar">Seleccionar</option>
                        {pieceOptions.map((pieceName, index) => (
                            <option key={`p-o-${index}`} value={pieceName}>
                                {pieceName}
                            </option>
                        ))}
                        <option value="Otro">Otro</option>
                    </Form.Select>

                    {(selectPieceValue === 'Otro' || isCustomPiece) && (
                        <Form.Control
                            className="mt-2"
                            type="text"
                            name="pieza" 
                            value={formData.pieza === 'Otro' ? '' : formData.pieza || ''}
                            placeholder="Escriba la pieza aqui"
                            onChange={handleInputChange}
                        />
                    )}
                </Form.Group>
                
            </div>
            <hr/>
            <h6 className="mt-3 mb-2">Compatible con:</h6>

            {/* Adaptable Marca/Modelo */}
            <div className="d-flex justify-content-between">
                <Form.Group className="mb-2 w-50 pe-2">
                    <Form.Label>Marca</Form.Label>
                    <Form.Select
                        name="marcaAdaptable" 
                        value={selectAdaptableMarcaValue}
                        onChange={handleInputChange}
                    >
                        <option value="Seleccionar">Seleccionar</option>
                        {marcaOptions.map((marcaName, index) => (
                            <option key={`m-a-${index}`} value={marcaName}>
                                {marcaName}
                            </option>
                        ))}
                        <option value="Otro">Otro </option>
                    </Form.Select>

                    {(selectAdaptableMarcaValue === 'Otro' || isCustomAdaptableMarca) && (
                        <Form.Control
                            className="mt-2 "
                            type="text"
                            name="marcaAdaptable" 
                            value={formData.marcaAdaptable === 'Otro' ? '' : formData.marcaAdaptable || ''}
                            placeholder="Escriba la marca aqui"
                            onChange={handleInputChange}
                        />
                    )}
                </Form.Group>
                <Form.Group className="mb-2 w-50 ps-2">
                    <Form.Label >Nombre y Modelo</Form.Label>
                    <Form.Control
                        type="text"
                        name="modeloAdaptable" 
                        value={formData.modeloAdaptable || ''}
                        onChange={handleInputChange}
                        
                    />
                </Form.Group>
            </div>
        </Form>
    );

    return (
        <Modal show={show} onHide={handleClose}  centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    Revisar y Editar Sugerencia 
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {renderGestionSugerenciasModalBody()}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cerrar
                </Button>
                <Button 
                    variant="primary" 
                    type="submit"
                    onClick={handleGuardarCambios}
                >
                    Guardar Cambios
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

function GestionSugerenciasPage() {
    const navigate = useNavigate(); 
    const [sugerencias, setSugerencias] = useState([]);
    const [sugerenciasFiltradas, setSugerenciasFiltradas] = useState([]); 
    const [searchTerm, setSearchTerm] = useState(''); 
    const [piezasNombre, setPiezasNombre] = useState([]);
    const [marcaNames, setMarcaNames] = useState([]);

    // Estado para el Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedSugerencia, setSelectedSugerencia] = useState(null);

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedSugerencia(null);
    };

    const fetchSugerencias = async () => {
        try {
            // Obtener Sugerencias
            const suggestionsSnapshot = await getDocs(collection(db, 'sugerenciasPiezas')); 
            let suggestionsData = suggestionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                userId: doc.data().userId || null, 
                nombreUsuario: doc.data().nombreUsuario || 'Anónimo', 
                emailUsuario: doc.data().emailUsuario || 'N/A',
                estado: doc.data().estado || 'Pendiente', 
                fechaSugerencia: doc.data().fechaSugerencia || null,
                marca: doc.data().marca || '', 
                modelo: doc.data().modelo || '',
                adaptableMarca: doc.data().adaptableMarca || '', 
                adaptableModelo: doc.data().adaptableModelo || '',
                pieza: doc.data().pieza || '',
                comentarios: doc.data().comentarios || 'Sin comentarios.'
            }));

            // Recolectar IDs de Usuarios únicos
            const userIds = [...new Set(suggestionsData.map(sug => sug.userId).filter(id => id))];
            const usersMap = {}; 

            // Buscar Datos de Usuarios usando los IDs recopilados
            if (userIds.length > 0) {
                const usersQuery = query(collection(db, 'usuarios'), where(documentId(), 'in', userIds));
                const usersSnapshot = await getDocs(usersQuery);
                
                usersSnapshot.docs.forEach(userDoc => {
                    const userData = userDoc.data();
                    usersMap[userDoc.id] = {
                        nombre: userData.nombreCompleto || userData.nombre || 'Usuario Desconocido',
                        correo: userData.email || userData.correo || 'correo_no_disponible@app.com',
                    };
                });
            }
    
            // Fusionar Datos de Usuario en Sugerencias
            const enrichedData = suggestionsData.map(sug => {
                const userData = usersMap[sug.userId];
                if (userData) {
                    return {
                        ...sug,
                        nombreUsuario: userData.nombre,
                        emailUsuario: userData.correo,
                    };
                }
                return sug;
            });

            //  Ordenar y establecer estado
            const sortedData = enrichedData.sort((a, b) => {
                if (a.estado === 'Pendiente' && b.estado !== 'Pendiente') return -1;
                if (a.estado !== 'Pendiente' && b.estado === 'Pendiente') return 1;
                
                const dateA = a.fechaSugerencia && a.fechaSugerencia.seconds ? new Date(a.fechaSugerencia.seconds * 1000) : new Date(0);
                const dateB = b.fechaSugerencia && b.fechaSugerencia.seconds ? new Date(b.fechaSugerencia.seconds * 1000) : new Date(0);
                return dateB - dateA; 
            });

            setSugerencias(sortedData);
            setSugerenciasFiltradas(sortedData); 
        } catch (error) {
            console.error("Error al cargar sugerencias:", error);
            Swal.fire('Error', 'No se pudieron cargar las sugerencias. Verifique la conexión a Firebase.', 'error');
        }
    };
    
    useEffect(() => {
        fetchSugerencias();
    }, []);

    useEffect(() => {
        const results = sugerencias.filter(sug => 
            sug.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sug.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sug.pieza?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sug.nombreUsuario?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            sug.emailUsuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
            sug.adaptableMarca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sug.adaptableModelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sug.estado?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSugerenciasFiltradas(results);
    }, [searchTerm, sugerencias]); 
    
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    useEffect(() => {
        const fetchPiezas = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'tablas')); 
                
                const rawPiezas = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const flatPiezas = rawPiezas.flatMap(pieza => {
                    // Si 'campos' es un array válido y tiene elementos
                    if (Array.isArray(pieza.campos) && pieza.campos.length > 0) {
                        return pieza.campos.map((campoItem, index) => ({
                            // Datos de nivel superior
                            id: `${pieza.id}-${index}`, 
                            parentId: pieza.id, 
                            nombre: pieza.nombre || '',
                            marca: pieza.marca || '',
                            modelo: pieza.modelo || '',
                            
                            // Datos anidados del array 'campos'
                            campo: campoItem.campo || '',
                            codigo: campoItem.codigo || '',
                            codigoCompatibilidad: campoItem.codigoCompatibilidad || '',
                            
                            // Índice original para el manejo de la edición
                            campoIndex: index 
                        }));
                    }
                    
                    // Si la pieza no tiene campos, aún la incluimos o la ignoramos.
                    return [{
                        id: `${pieza.id}-0`, 
                        parentId: pieza.id,
                        nombre: pieza.nombre || '',
                        marca: pieza.marca || '',
                        modelo: pieza.modelo || '',
                        campo: '', codigo: '', codigoCompatibilidad: '',
                        campoIndex: 0
                    }];
                }); 
               
                const uniquePieceNames = [...new Set(flatPiezas.map(p => p.campo))].filter(Boolean); // Filtrar valores vacíos
                setPiezasNombre(uniquePieceNames);
                const uniqueMarcaNames = [...new Set(flatPiezas.map(p => p.marca))].filter(Boolean);
                setMarcaNames(uniqueMarcaNames);
            } catch (error) {
                console.error("Error al cargar piezas (tablas):", error);
            }
        };
        fetchPiezas();
    }, []);

    // Muestra el modal de revisión
    const handleRevisar = (sug) => {
        setSelectedSugerencia(sug);
        setShowModal(true);
    };

    const handleEliminar = async (id) => {
        const result = await Swal.fire({
            title:"¿Eliminar Sugerencia?", 
            text: "¡Esta acción eliminará la sugerencia permanentemente!", 
            icon: "warning",
            showCancelButton: true,
            background: '#052b27ff', 
            color: '#ffdfdfff', 
            confirmButtonColor: '#c55123ff', 
            cancelButtonColor: '#07433E', 
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, 'sugerenciasPiezas', id)); 
                fetchSugerencias(); 
                Swal.fire({
                    title: 'Eliminado', 
                    text: 'Sugerencia eliminada correctamente.', 
                    icon: 'success',
                    background: '#052b27ff', 
                    color: '#ffdfdfff', 
                    confirmButtonColor: '#0b6860ff'
                });
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title:"Error", 
                    text: "No se pudo eliminar el registro.", 
                    icon: "error",
                    background: '#052b27ff', 
                    color: '#ffdfdfff', 
                    confirmButtonColor: '#0b6860ff'
                });
            }
        }
    };

    const getEstadoClase = (estado) => {
        switch ((estado || 'Pendiente').toLowerCase()) {
            case 'aceptado':
                return 'bg-success1'; 
            case 'rechazado':
                return 'bg-danger1'; 
            case 'en revisión':
                return 'bg-info1'; 
            case 'pendiente':
            default:
                return 'bg-warning1'; 
        }
    };
    
    return (
        <>
            <NavBar/>
            <main className="main-content-dashboard bg-gradient2">
                
                <Container className="mt-5 mb-5">
                    <div className="table-container">
                        {/* HEADER DE LA TABLA */}
                        <div className="header-tabla">
                            <div className="nombre-tabla">
                                <img src={IconoSugerencia} width="44px" height="44px" alt="Icono Sugerencias" />
                                <h2>
                                    Gestión de Sugerencias de Compatibilidad
                                </h2>
                            </div>
                            <div className="d-flex align-items-center">
                                <div className="count-info2">
                                    <span className="count-number2">{sugerencias.filter(s => s.estado === 'Pendiente').length}</span> Sugerencias Pendientes
                                </div>
                            </div>
                        </div>

                        {/* ACCIONES Y BÚSQUEDA */}
                        <div className='header-tabla2'>
                            <button type="button" className="btn-volver" onClick={() => navigate(-1)}>
                                Volver
                            </button>
                            <InputGroup className="search-input-group2" style={{ maxWidth: '300px' }}>
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
                                    alt="Icono Buscar"
                                />
                            </InputGroup>
                        </div>
                        
                        {/* CUERPO DE LA TABLA */}
                        <div style={{ overflowX: 'auto' }}>
                                <Table striped bordered hover responsive className="tabla-auxiliares">
                                    <thead>
                                        <tr>
                                            <th>Sugerente (Nombre / Correo)</th> 
                                            <th>La Pieza Sugerida</th>
                                            <th>Del celular (Celular / Modelo)</th>
                                            <th>Es compatible con (Celular y Modelo / Marca)</th>
                                            <th>Fecha Envío</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sugerenciasFiltradas.map(sug => (
                                            <tr key={sug.id}>
                                                <td>
                                                    <p className='mb-0 fw-bold'>{sug.nombreUsuario}</p>
                                                    <span className='small' style={{color: '#257e73'}}>{sug.emailUsuario}</span>
                                                </td>

                                                <td className='fw-bold'>{sug.pieza || 'Desconocida'}</td>

                                                <td>
                                                    <span className='badge bg-dark me-1'>ORIGEN</span><br/>
                                                    {sug.nombreCelular || 'N/A'} - {sug.modelo || 'N/A'}
                                                </td>

                                                <td>
                                                    <span className='badge bg-info text-dark me-1'>DESTINO</span><br/>
                                                     {sug.adaptableModelo || 'N/A'} - {sug.adaptableMarca || 'N/A'}
                                                </td>

                                                <td className='small'>{formatFecha(sug.fechaSugerencia) || '-'}</td>

                                                <td>
                                                    <span className={`badge estado-badge ${getEstadoClase(sug.estado)}`}>
                                                        {sug.estado || 'Pendiente'}
                                                    </span>
                                                </td>

                                                <td>
                                                    <Button
                                                        size="sm"
                                                        variant='warning'
                                                        className="me-2" 
                                                        onClick={() => handleRevisar(sug)} 
                                                        title="Revisar y Editar Solicitud"
                                                    >
                                                        <img 
                                                            src={IconoRevisar} 
                                                            alt="btn-revisar" 
                                                            width="30px"
                                                            height="30px"
                                                        />
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleEliminar(sug.id)}
                                                        title="Eliminar permanentemente"
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
                    </div>
                </Container>
            </main>
            <Footer/>
            
            {/* MODAL DE REVISIÓN */}
            <ModalSugerencias 
                show={showModal} 
                handleClose={handleCloseModal} 
                sugerencia={selectedSugerencia} 
                refreshTable={fetchSugerencias} 
                piezasNombre={piezasNombre}
                marcaNames={marcaNames}
            />
        </>
    );
}

export default GestionSugerenciasPage;