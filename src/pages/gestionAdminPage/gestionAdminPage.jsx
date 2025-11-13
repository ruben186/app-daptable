import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
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
            // Caso base: Si es un valor simple, lo agregamos.
            parts.push(normalizeString(v));
            
        } else if (Array.isArray(v)) {
            v.forEach(helper);
            
        } else if (t === 'object') {
            // Si es un objeto (como {campo: "Pantalla", codigo: "..."}),
            // iteramos recursivamente sobre CADA valor de sus propiedades.
            Object.values(v).forEach(helper);
        }
    };
    
    helper(value);
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

    const navigate = useNavigate();

    // Estado centralizado de Usuarios
    const [usuarios, setUsuarios] = useState([]);
    const [searchQueryUsuarios, setSearchQueryUsuarios] = useState('');
    
    // Estados para otras colecciones
    const [piezas, setPiezas] = useState([]);
    const [searchQueryPiezas, setSearchQueryPiezas] = useState('');

    const [estudios, setEstudios] = useState(Array(3).fill({ id: 1, nombre: 'Modelo A-2024' }));
    const [compatibilidad, setCompatibilidad] = useState(Array(4).fill({ id: 1, nombre: 'Comp. Sugerida' }));

    const [loading, setLoading] = useState(false);
    
    // Estados para Edición/Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // Almacena el item (usuario o pieza) a editar
    const [itemType, setItemType] = useState(null); // 'usuario' o 'pieza'
    
    // 1. Carga de Usuarios
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

    // 2. Carga de Piezas
    useEffect(() => {
        const fetchPiezas = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, 'tablas')); 
                const data = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                setPiezas(data);
            } catch (error) {
                console.error("Error al cargar piezas (tablas):", error);
                setPiezas([]); 
            } finally {
                setLoading(false);
            }
        };
        fetchPiezas();
    }, []);

    // ------------------------------------------------------------------
    // --- MANEJADORES DE USUARIO ---
    // ------------------------------------------------------------------
    
    const handleEditUser = (user) => {
        setSelectedItem({
            ...user,
            // Asegura que la edad se calcule al abrir
            edad: calcularEdad(user.fechaNacimiento) 
        });
        setItemType('usuario');
        setShowModal(true);
    };

    const handleEliminarUser = async (id) => {
           const result = await Swal.fire({
                title:"¿Estás Seguro?", 
                text: "¡No podrás recuperar este registro de usuario!", 
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
                await deleteDoc(doc(db, 'usuarios', id));
                setUsuarios(usuarios.filter(a => a.id !== id));
                Swal.fire({
                    title: 'Eliminado', 
                    text: 'Registro de usuario eliminado correctamente.', 
                    icon: 'success',
                    background: '#052b27ff',
                    color: '#ffdfdfff',
                    confirmButtonColor: '#0b6860ff'
                });
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title:"Error", 
                    text: "No se pudo eliminar el registro de usuario.", 
                    icon: "error",
                    background: '#052b27ff',
                    color: '#ffdfdfff',
                    confirmButtonColor: '#0b6860ff',
                });
            }
        }
    };
    
    const handleSaveChangesUser = async () => {
        if (!selectedItem || itemType !== 'usuario') return;

        // ... (Tu bloque de validaciones completo aquí)
        try {
            const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
            const soloNumeros = /^[0-9]+$/;
            
            if(selectedItem.nombreCompleto === '' || selectedItem.telefono === '' 
                || selectedItem.email === '' || selectedItem.fechaNacimiento === '' || selectedItem.sexo === '' || selectedItem.estado === ''
                || selectedItem.rol === ''){
                Swal.fire({ title:"Campos incompletos", text: "Todos los campos deben ser llenados.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff', });
                return;
            }else{
                if (!soloLetras.test(selectedItem.nombreCompleto)) {
                    Swal.fire({ title:"Error", text: "El campo de su nombre completo solo debe contener letras.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff', });
                    return;
                }
                if (!soloNumeros.test(selectedItem.telefono)) {
                    Swal.fire({ title:"Error", text: "El campo de telefono solo debe contener numeros.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff', });
                    return;
                }
                if(selectedItem.telefono.length > 10){
                    Swal.fire({ title:"Error", text: "El campo de telefono debe tener como maximo 10 caracteres.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff', });
                    return;
                }
            }
            // ... (Fin de tu bloque de validaciones)

            const userRef = doc(db, 'usuarios', selectedItem.id);
            await updateDoc(userRef, {
                nombreCompleto: selectedItem.nombreCompleto,
                telefono: selectedItem.telefono,
                email: selectedItem.email,
                fechaNacimiento: selectedItem.fechaNacimiento,
                edad: selectedItem.edad,
                sexo: selectedItem.sexo,
                estado: selectedItem.estado,
                rol: selectedItem.rol
            });

            // Actualiza el estado local de usuarios
            setUsuarios(usuarios.map(a =>
                a.id === selectedItem.id ? selectedItem : a
            ));

            setShowModal(false);
            Swal.fire('Actualizado', 'Los datos del usuario fueron actualizados.', 'success');
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo actualizar el usuario.', 'error');
        }
    };

    const handleModalChangeUser = (e) => {
        const { name, value } = e.target;
        setSelectedItem((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'fechaNacimiento') {
                updated.edad = calcularEdad(value);
            }
            return updated;
        });
    };

    // ------------------------------------------------------------------
    // --- MANEJADORES DE PIEZA ---
    // ------------------------------------------------------------------
    
   const handleEditPieza = (pieza) => {
    // 💡 SOLUCIÓN: Creamos una copia plana, y si existe el array 'campos',
    // lo usamos para inicializar los campos del modal.
    const tempItem = {
        ...pieza,
        // Usamos campos temporales para el modal, extrayendo el primer elemento si existe
        campo: (pieza.campos && pieza.campos[0] && pieza.campos[0].campo) || '',
        codigo: (pieza.campos && pieza.campos[0] && pieza.campos[0].codigo) || '',
        codigoCompatibilidad: (pieza.campos && pieza.campos[0] && pieza.campos[0].codigoCompatibilidad) || '',
        
        // Almacenamos el array original de campos si queremos mantener los demás elementos
        // o si queremos actualizar completamente el array campos en la base de datos.
        // Aquí vamos a SIMPLIFICAR y solo editamos el primer elemento (índice 0).
    };

    setSelectedItem(tempItem);
    setItemType('pieza');
    setShowModal(true);
};
    
    const handleDeletePiezaReal = async (id) => {
        const result = await Swal.fire({
            title:"¿Estás Seguro?", 
            text: "¡No podrás recuperar este registro de pieza!", 
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
    
    const handleSaveChangesPieza = async () => {
    if (!selectedItem || itemType !== 'pieza') return;
    
    // Asumimos que solo editamos el primer elemento del array 'campos'
    // y que los campos anidados son 'campo', 'codigo', y 'codigoCompatibilidad'.
    
    try {
        const piezaRef = doc(db, 'tablas', selectedItem.id);
        
        // 🚨 SOLUCIÓN: Reconstruir el array 'campos' manteniendo la estructura
        // Al editar solo un conjunto de campos, asumimos que son los únicos o los más relevantes.
        
        // El array 'campos' tendrá un solo elemento con los datos editados:
        const camposArray = [
            { 
                campo: selectedItem.campo || '', 
                codigo: selectedItem.codigo || '', 
                codigoCompatibilidad: selectedItem.codigoCompatibilidad || '' 
            },
        ];
        
        // Objeto a actualizar en Firebase
        const dataToUpdate = {
            nombre: selectedItem.nombre || '',
            marca: selectedItem.marca || '',
            modelo: selectedItem.modelo || '',
            campos: camposArray, // Guardamos el array reconstruido
        };

        await updateDoc(piezaRef, dataToUpdate);

        // Actualiza el estado local de piezas (importante para la vista)
        setPiezas(prevPiezas => prevPiezas.map(p => {
            if (p.id === selectedItem.id) {
                // Devolvemos el objeto actualizado con los nuevos campos anidados
                return { ...p, ...dataToUpdate };
            }
            return p;
        }));

        setShowModal(false);
        Swal.fire({
            title:'Actualizado', 
            text: 'Los datos de la pieza fueron actualizados.', 
            icon: 'success',
            background: '#052b27ff',
            color: '#ffdfdfff',
            confirmButtonColor: '#0b6860ff'
        });
    } catch (error) {
        console.error("Error al guardar cambios de pieza:", error);
        Swal.fire({
            title:'Error', 
            text: 'No se pudo actualizar la pieza.', 
            icon: 'error',
            background: '#052b27ff',
            color: '#ffdfdfff',
            confirmButtonColor: '#0b6860ff'
        });
    }
};

   const handleModalChangePieza = (e) => {
    const { name, value } = e.target;
    // La modificación del estado temporal es sencilla ya que los campos están planos
    setSelectedItem((prev) => ({ ...prev, [name]: value }));
};
    
    // ------------------------------------------------------------------
    // --- RENDERIZADO DEL MODAL ---
    // ------------------------------------------------------------------

    const renderModalBody = () => {
        if (!selectedItem) return null;

        if (itemType === 'usuario') {
            return (
                <Form>
                    {/* Nombre Completo */}
                    <Form.Group className="mb-2">
                        <Form.Label>Nombres Completo</Form.Label>
                        <Form.Control
                            type="text"
                            name="nombreCompleto"
                            value={selectedItem.nombreCompleto || ''}
                            onChange={handleModalChangeUser}
                        />
                    </Form.Group>
                    {/* Teléfono */}
                    <Form.Group className="mb-2">
                        <Form.Label>Teléfono</Form.Label>
                        <Form.Control
                            type="text"
                            name="telefono"
                            value={selectedItem.telefono || ''}
                            onChange={handleModalChangeUser}
                        />
                    </Form.Group>
                    {/* Email */}
                    <Form.Group className="mb-2">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={selectedItem.email || ''}
                            disabled 
                        />
                    </Form.Group>
                    {/* Fecha Nacimiento y Edad */}
                    <div className="d-flex justify-content-between">
                        <Form.Group className="mb-2 w-50 pe-2">
                            <Form.Label>Fecha de Nacimiento</Form.Label>
                            <Form.Control
                                type="date"
                                name="fechaNacimiento"
                                value={selectedItem.fechaNacimiento || ''}
                                onChange={handleModalChangeUser}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2 w-50 ps-2">
                            <Form.Label>Edad</Form.Label>
                            <Form.Control
                                type="text"
                                name="edad"
                                value={selectedItem.edad || '-'}
                                readOnly
                            />
                        </Form.Group>
                    </div>
                    {/* Sexo */}
                    <Form.Group className="mb-2">
                        <Form.Label>Sexo</Form.Label>
                        <Form.Select
                            name="sexo"
                            value={selectedItem.sexo || ''}
                            onChange={handleModalChangeUser}
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
                            value={selectedItem.estado || 'Pendiente'}
                            onChange={handleModalChangeUser}
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
                            value={selectedItem.rol || 'usuario'}
                            onChange={handleModalChangeUser}
                        >
                            <option value="">Seleccionar</option>
                            <option>Usuario</option>
                            <option>Invitado</option>
                            <option>Admin</option>
                        </Form.Select>
                    </Form.Group>
                </Form>
            );
        } else if (itemType === 'pieza') {
            return (
                <Form>
                    {/* Nombre */}
                    <Form.Group className="mb-2">
                        <Form.Label>Nombre de la Pieza</Form.Label>
                        <Form.Control
                            type="text"
                            name="nombre"
                            value={selectedItem.nombre || ''}
                            onChange={handleModalChangePieza}
                        />
                    </Form.Group>
                    {/* Campo */}
                    <Form.Group className="mb-2">
                        <Form.Label>Pieza</Form.Label>
                        <Form.Control
                            type="text"
                            name="campo"
                            value={selectedItem.campo || ''}
                            onChange={handleModalChangePieza}
                        />
                    </Form.Group>
                    {/* Código */}
                    <Form.Group className="mb-2">
                        <Form.Label>Código de Pieza</Form.Label>
                        <Form.Control
                            type="text"
                            name="codigo"
                            value={selectedItem.codigo || ''}
                            onChange={handleModalChangePieza}
                        />
                    </Form.Group>
                    {/* Código Compatibilidad */}
                    <Form.Group className="mb-2">
                        <Form.Label>Código Compatibilidad</Form.Label>
                        <Form.Control
                            type="text"
                            name="codigoCompatibilidad"
                            value={selectedItem.codigoCompatibilidad || ''}
                            onChange={handleModalChangePieza}
                        />
                    </Form.Group>
                    {/* Marca */}
                    <Form.Group className="mb-2">
                        <Form.Label>Marca</Form.Label>
                        <Form.Control
                            type="text"
                            name="marca"
                            value={selectedItem.marca || ''}
                            onChange={handleModalChangePieza}
                        />
                    </Form.Group>
                    {/* Modelo */}
                    <Form.Group className="mb-2">
                        <Form.Label>Modelo</Form.Label>
                        <Form.Control
                            type="text"
                            name="modelo"
                            value={selectedItem.modelo || ''}
                            onChange={handleModalChangePieza}
                        />
                    </Form.Group>
                </Form>
            );
        }
        return null;
    };
    
    const handleSave = itemType === 'usuario' ? handleSaveChangesUser : 
                       itemType === 'pieza' ? handleSaveChangesPieza : 
                       () => alert('Función de guardado no definida');
                       
    const modalTitle = itemType === 'usuario' ? 'Editar Usuario' : 
                       itemType === 'pieza' ? 'Editar Pieza' : 
                       'Editar Registro';


    return (
        <>
            <NavBar/>
            <main className="main-content-dashboard bg-gradient2">
                <div className="admin-container">
                    <div className="header-admin">
                        <h1>Sistema de Gestion Administrador</h1>
                    </div>
                    
                    <div className="dashboard-grid">
                        
                        {/* 1. SECCIÓN USUARIOS */}
                        <DataCard
                            title="Usuarios"
                            icon={IconoUsuario}
                            data={usuarios}
                            searchQuery={searchQueryUsuarios}
                            setSearchQuery={setSearchQueryUsuarios}
                            collectionName="usuarios"
                            handleEdit={handleEditUser}
                            handleDelete={handleEliminarUser}
                            link={'/registroUsuarios'}
                            linkNuevo={'/nuevoUsuario'}
                        />
                        
                        {/* 2. SECCIÓN PIEZAS  */}
                        <DataCard
                            title="Piezas"
                            icon={IconoPieza}
                            data={piezas}
                            searchQuery={searchQueryPiezas}
                            setSearchQuery={setSearchQueryPiezas} 
                            collectionName="piezas"
                            handleEdit={handleEditPieza}
                            handleDelete={handleDeletePiezaReal}
                            link={'/registroPiezas'}
                            linkNuevo={'/nuevaPieza'}
                        />
                        
                        {/* 3. SECCIÓN M. ESTUDIO  */}
                        <DataCard
                            title="M. Estudio"
                            icon={IconoLibro}
                            data={estudios}
                            searchQuery={''}
                            setSearchQuery={() => {}} 
                            collectionName="estudios"
                            handleEdit={() => alert('Implementar edición de M. Estudio')}
                            handleDelete={() => alert('Implementar eliminación de M. Estudio')}
                            link={'/registroEstudios'}
                            linkNuevo={'/nuevoEstudio'}
                        />
                        
                        {/* 4. SECCIÓN COMPATIBILIDAD SUGERIDA */}
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
                                link={'/registroCompatibilidad'}
                                linkNuevo={'/nuevaCompatibilidad'}
                            />

                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL EDICIÓN (REUTILIZADO) */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="modal-header-custom">
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="modal-body-custom">
                    {renderModalBody()}
                </Modal.Body>
                <Modal.Footer className="modal-footer-custom">
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Guardar Cambios
                    </Button>
                </Modal.Footer>
            </Modal>
            
            <Footer/>
        </>
    );
}

export default GestionAdminPage;