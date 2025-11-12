import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
// Solo importaremos Modal, Form de Bootstrap, y los iconos Fa
import { Modal, Form, Button } from 'react-bootstrap'; 
import { FaEdit, FaTrash, FaUser, FaPlus, FaSearch, FaBook, FaBox } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { auth, db } from '../../firebase';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';
import IconoEditar from '../../assets/Iconos/iconoEditar.png';
import IconoEliminar from '../../assets/Iconos/iconoEliminar.png';
import IconoPieza from '../../assets/Iconos/iconoPieza.png';
import IconoLibro from '../../assets/Iconos/iconoLibro.png';
import IconoUsuario from '../../assets/Iconos/usuario2.png';
// Importa estilos CSS para el diseño dark/tecno (debes crear el archivo)
import './gestionAdminPage.css'; 


// --- [ UTILIDADES REQUERIDAS DE TU CÓDIGO ] ---------------------------------
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

// ** Nueva utilidad para la búsqueda en tiempo real (basada en el ejemplo anterior) **
const normalizeString = (s) => {
    if (s === null || s === undefined) return '';
    try {
        return String(s)
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[-_]+/g, ' ')
          .replace(/[^\p{L}\p{N}]+/gu, ' ')
          .trim()
          .replace(/\s+/g, ' ');
    } catch (e) {
        return String(s)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[-_]+/g, ' ')
          .replace(/[^a-z0-9 ]+/g, ' ')
          .trim()
          .replace(/\s+/g, ' ');
    }
};

const extractTextForSearch = (value) => {
    const parts = [];
    const helper = (v) => {
        if (v === null || v === undefined) return;
        const t = typeof v;
        if (t === 'string' || t === 'number' || t === 'boolean') {
            parts.push(normalizeString(v));
        } else if (t === 'object') {
            Object.values(v).forEach(helper);
        }
    };
    helper(value);
    //  valores normalizados para la búsqueda de subcadenas
    return parts.join(' '); 
};

// Componente reutilizable para cada sección del dashboard

const DataCard = ({ title, icon, data, searchQuery, setSearchQuery, collectionName, handleEdit, handleDelete, link, linkNuevo }) => {
    
    const [isSearchVisible, setIsSearchVisible] = useState(false); 

    const filteredData = data.filter((item) => {
        const q = (searchQuery || '').toLowerCase().trim();
        if (!q) return true;
        const hayTexto = extractTextForSearch(item);
        const qlTerms = q.split(' ').filter(term => term.length > 0);
        return qlTerms.every(term => hayTexto.includes(term));
    });

    const isUserCard = collectionName === 'usuarios';

    const toggleSearch = () => {
        setIsSearchVisible(!isSearchVisible);
        if (isSearchVisible) {
            setSearchQuery('');
        }
    };
    
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };
    const navigate = useNavigate();

    return (
        // 💡 1. CONTENEDOR PRINCIPAL QUE GESTIONA LA SEPARACIÓN (Gap vertical)
        <div className="admin-card-wrapper">
            
            {/* 2. BLOQUE PRINCIPAL: HEADER, BÚSQUEDA y LISTA (Cuerpo de la tarjeta) */}
            <div className="admin-card">
                
                <div className="card-header-admin">
                    {/* Contenido del Header... */}
                    <div className="card-header-left">
                        <span className="card-icon"><img src={icon} width="44px" height="44px" /></span> 
                        <h3 className="card-titulo">{title}</h3>
                    </div>
                    
                    <div className="card-header-right">
                        <button className="new-btn" onClick={() => navigate(linkNuevo)}>
                            <FaPlus className="plus-new" /> Nuevo
                        </button>
                        <button className={`btn-icon search-toggle-btn ${isSearchVisible ? 'active-search' : ''}`} onClick={toggleSearch}>
                             <img 
                                width="28px"
                                height="28px"
                                src={IconoBuscar}
                             />
                        </button>
                    </div>
                </div>

                {/* BARRA DE BÚSQUEDA DESPLEGABLE */}
                <div className={`search-box-container ${isSearchVisible ? 'visible' : ''}`}>
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Buscar..." 
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                    </div>
                </div>
                
                {/* CUERPO DE LA LISTA */}
                <div className="card-list">
                    {filteredData.slice(0, 4).map((item) => (
                        <div key={item.id} className="list-item">
                            <span className="item-text">
                                {isUserCard ? (item.nombreCompleto || item.email || item.id) : (item.nombre || item.id)}
                            </span> 
                            <div className="item-actions">
                                <button className="btn-icon edit-btn" title="Editar" onClick={() => handleEdit(item)}>
                                    <img 
                                    src={IconoEditar} 
                                    alt="btn-editar" 
                                    width="30px"
                                    height="30px"
                                    />
                                </button>
                                <button className="btn-icon delete-btn" title="Eliminar" onClick={() => handleDelete(item.id)}>
                                    <img 
                                    src={IconoEliminar} 
                                    alt="btn-eliminar"
                                    width="30px"
                                    height="30px"
                                    />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredData.length === 0 && <div className="list-item no-data">No hay {title.toLowerCase()} que coincidan.</div>}
                </div>
                
                {/* ¡NOTA! El "Footer" y el "Contador" se han eliminado de aquí */}
                
            </div> {/* Fin de .admin-card */}


            {/* 💡 3. BLOQUE SEPARADO: PIE DE PÁGINA (Botón "Ver más") */}
            {/* Este div tiene el fondo y el borde turquesa de la imagen */}
            <div className="card-footer-admin">
                <button className="btn-ver-mas" onClick={() => navigate(link)}>
                   <span className='chevM'/> Ver más
                </button>
            </div>

            {/* 💡 4. BLOQUE SEPARADO: CONTADOR DE REGISTROS */}
            {/* Este div tiene el fondo oscuro y gestiona la alineación del contador */}
            <div className="count-info-box"> 
                 <div className="count-info">
                    <span className="count-number">{data.length}</span> {title} Registrados
                </div>
            </div>

        </div> // Fin de .admin-card-wrapper
    );
};


function GestionAdminPage() {

    // Estado centralizado de Usuarios
    const [usuarios, setUsuarios] = useState([]);
    const [searchQueryUsuarios, setSearchQueryUsuarios] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estados para Edición/Modal (Reutilizados de tu código)
    const [showModal, setShowModal] = useState(false);
    const [selectedAux, setSelectedAux] = useState(null);

    // Estados para otras colecciones (solo para visualización inicial)
    const [piezas, setPiezas] = useState(Array(3).fill({ id: 1, nombre: 'Pantalla XYZ' }));
    const [estudios, setEstudios] = useState(Array(3).fill({ id: 1, nombre: 'Modelo A-2024' }));
    const [compatibilidad, setCompatibilidad] = useState(Array(4).fill({ id: 1, nombre: 'Comp. Sugerida' }));
    
    // 1. Carga de Usuarios (Tu lógica de `useEffect`)
    useEffect(() => {
        const fetchUsuarios = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, 'usuarios'));
                const data = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(user => {
                        const rol = user.rol?.toLowerCase();
                        // Mantenemos tu filtro de roles
                        return rol === 'admin' || rol === 'usuario' || rol === '' || rol === '-'; 
                    });
                setUsuarios(data);
            } catch (error) {
                 console.error("Error al cargar usuarios:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsuarios();
    }, []);

    // 2. Manejadores de CRUD (Tu lógica adaptada)
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
            // Asegura que la edad se calcule al abrir
            edad: calcularEdad(aux.fechaNacimiento) 
        });
        setShowModal(true);
    };

    const handleSaveChanges = async () => {
        // Validación adaptada de tu código
        try {
            const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
            const soloNumeros = /^[0-9]+$/;
            
            // ... (Tu bloque de validaciones completo aquí)
            if(selectedAux.nombreCompleto === '' || selectedAux.telefono === '' 
                || selectedAux.email === '' || selectedAux.fechaNacimiento === '' || selectedAux.sexo === '' || selectedAux.estado === ''
                || selectedAux.rol === ''){
                Swal.fire({ title:"Campos incompletos", text: "Todos los campos deben ser llenados.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff', });
                return;
            }else{
                if (!soloLetras.test(selectedAux.nombreCompleto)) {
                    Swal.fire({ title:"Error", text: "El campo de su nombre completo solo debe contener letras.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff', });
                    return;
                }
                if (!soloNumeros.test(selectedAux.telefono)) {
                    Swal.fire({ title:"Error", text: "El campo de telefono solo debe contener numeros.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff', });
                    return;
                }
                if(selectedAux.telefono.length > 10){
                    Swal.fire({ title:"Error", text: "El campo de telefono debe tener como maximo 10 caracteres.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff', });
                    return;
                }
            }
            // ... (Fin de tu bloque de validaciones)

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

            // Actualiza el estado local de usuarios
            setUsuarios(usuarios.map(a =>
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

    // ------------------------------------------------------------------
    
    return (
        <>
            <NavBar/>
            <main className="main-content-dashboard bg-gradient2">
                <div className="admin-container">
                    <div className="header-admin">
                        <h1>Sistema de Gestion Administrador</h1>
                    </div>
                    
                    <div className="dashboard-grid">
                        
                        {/* 1. SECCIÓN USUARIOS (Con toda la lógica de tu código) */}
                        <DataCard
                            title="Usuarios"
                            icon={IconoUsuario}
                            data={usuarios}
                            searchQuery={searchQueryUsuarios}
                            setSearchQuery={setSearchQueryUsuarios}
                            collectionName="usuarios"
                            handleEdit={handleEdit}
                            handleDelete={handleEliminar}
                            link={'/registroUsuarios'}
                            linkNuevo={'/nuevoUsuario'}
                        />
                        
                        {/* 2. SECCIÓN PIEZAS (Estructura visual, sin lógica de Firebase) */}
                        <DataCard
                            title="Piezas"
                            icon={IconoPieza}
                            data={piezas}
                            searchQuery={''}
                            setSearchQuery={() => {}} 
                            collectionName="piezas"
                            handleEdit={() => alert('Implementar edición de Piezas')}
                            handleDelete={() => alert('Implementar eliminación de Piezas')}
                        />
                        
                        {/* 3. SECCIÓN M. ESTUDIO (Estructura visual, sin lógica de Firebase) */}
                        <DataCard
                            title="M. Estudio"
                            icon={IconoLibro}
                            data={estudios}
                            searchQuery={''}
                            setSearchQuery={() => {}} 
                            collectionName="estudios"
                            handleEdit={() => alert('Implementar edición de M. Estudio')}
                            handleDelete={() => alert('Implementar eliminación de M. Estudio')}
                        />
                        
                        {/* 4. SECCIÓN COMPATIBILIDAD SUGERIDA (Abajo) */}
                        <div className="grid-full-width">
                            <DataCard
                                title="Compatibilidad Sugerida"
                                icon={IconoPieza}
                                data={compatibilidad}
                                searchQuery={''}
                                setSearchQuery={() => {}} 
                                collectionName="compatibilidad"
                                handleEdit={() => alert('Implementar edición de Compatibilidad')}
                                handleDelete={() => alert('Implementar eliminación de Compatibilidad')}
                            />

                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL EDICIÓN (Reutilizado de tu código) */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="modal-header-custom">
                    <Modal.Title>Editar Usuario</Modal.Title>
                </Modal.Header>
                <Modal.Body className="modal-body-custom">
                    {selectedAux && (
                        <Form>
                            {/* Nombre Completo */}
                            <Form.Group className="mb-2">
                                <Form.Label>Nombres Completo</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="nombreCompleto"
                                    value={selectedAux.nombreCompleto}
                                    onChange={handleModalChange}
                                />
                            </Form.Group>
                            {/* Teléfono */}
                            <Form.Group className="mb-2">
                                <Form.Label>Teléfono</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="telefono"
                                    value={selectedAux.telefono}
                                    onChange={handleModalChange}
                                />
                            </Form.Group>
                            {/* Email */}
                            <Form.Group className="mb-2">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={selectedAux.email}
                                    disabled // Mantienes el campo deshabilitado
                                />
                            </Form.Group>
                            {/* Fecha Nacimiento y Edad */}
                            <div className="d-flex justify-content-between">
                                <Form.Group className="mb-2 w-50 pe-2">
                                    <Form.Label>Fecha de Nacimiento</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="fechaNacimiento"
                                        value={selectedAux.fechaNacimiento || ''}
                                        onChange={handleModalChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2 w-50 ps-2">
                                    <Form.Label>Edad</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="edad"
                                        value={selectedAux.edad || '-'}
                                        readOnly
                                    />
                                </Form.Group>
                            </div>
                            {/* Sexo */}
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
                            {/* Estado */}
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
                            {/* Rol */}
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
                <Modal.Footer className="modal-footer-custom">
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

export default GestionAdminPage;