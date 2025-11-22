import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, getDoc} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Modal, Form, Button } from 'react-bootstrap'; 
import { FaEdit, FaTrash, FaUser, FaPlus, FaSearch, FaBook, FaBox } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { auth, db } from '../../firebase';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
// Asegúrate de que las rutas de los iconos sean correctas en tu proyecto
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
        // Fallback para entornos que no soportan \p{Diacritic}
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

const DataCard = ({ title, icon, data, searchQuery, setSearchQuery, collectionName, handleEdit, handleDelete, link, linkNuevo, showNewButton }) => {
    
    const [isSearchVisible, setIsSearchVisible] = useState(false); 

    const filteredData = data.filter((item) => {
        const q = (searchQuery || '').toLowerCase().trim();
        if (!q) return true;
        const hayTexto = extractTextForSearch(item);
        const qlTerms = q.split(' ').filter(term => term.length > 0);
        return qlTerms.every(term => hayTexto.includes(term));
    });

    // Determina si es una tarjeta de usuario para la visualización del nombre
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
                        <span className="card-icon"><img src={icon} width="44px" height="44px" alt={`${title} Icon`} /></span> 
                        <h3 className="card-titulo">{title}</h3>
                    </div>
                    
                    <div className="card-header-right">
                        {showNewButton && (
                        <button className="new-btn" onClick={() => navigate(linkNuevo)}>
                            <FaPlus className="plus-new" /> Nuevo
                        </button>
                        )}
                        
                        <button className={`btn-icon search-toggle-btn ${isSearchVisible ? 'active-search' : ''}`} onClick={toggleSearch}>
                             <img 
                                 width="28px"
                                 height="28px"
                                 src={IconoBuscar}
                                 alt="Buscar"
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
                                {/* Lógica de visualización del texto del ítem */}
                                {
                                  collectionName === 'usuarios' ? (item.nombreCompleto || item.email || item.id) : 
                                  collectionName === 'piezas' ? `${item.nombre || item.id} ${item.campo ? ' - ' + item.campo : ''}` :
                                  // LÓGICA AGREGADA PARA COMPATIBILIDAD: Muestra el campo decorado 'displayText'
                                  collectionName === 'compatibilidad' ? (item.displayText || item.id) : 
                                  (item.nombre || item.id)
                                }
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
                                <button className="btn-icon delete-btn" title="Eliminar" onClick={() => handleDelete(item.parentId || item.id)}>
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
                
            </div> 


            {/* 3. BLOQUE SEPARADO: PIE DE PÁGINA (Botón "Ver más") */}
            <div className="card-footer-admin">
                <button className="btn-ver-mas" onClick={() => navigate(link)}>
                   <span className='chevM'/> Ver más
                </button>
            </div>

            {/* 4. BLOQUE SEPARADO: CONTADOR DE REGISTROS */}
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
    const [piezasNombre, setPiezasNombre] = useState([]);
    const [marcaNames, setMarcaNames] = useState([]);
    const [searchQueryPiezas, setSearchQueryPiezas] = useState('');

    // ** [NUEVOS ESTADOS] **
    const [estudios, setEstudios] = useState([]); // Array de datos de estudios
    const [searchQueryEstudios, setSearchQueryEstudios] = useState('');
    
    const [compatibilidad, setCompatibilidad] = useState([]); // Array de datos de compatibilidad (sugerenciasPiezas)
    const [searchQueryCompatibilidad, setSearchQueryCompatibilidad] = useState('');
    // ESTADO PARA LA LISTA PROCESADA
    const [decoratedCompatibilidad, setDecoratedCompatibilidad] = useState([]); 


    const [loading, setLoading] = useState(false);
    
    // Estados para Edición/Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // Almacena el item (usuario o pieza) a editar
    const [itemType, setItemType] = useState(null); // 'usuario', 'pieza', 'estudio', o 'compatibilidad'

    
    // Manejador genérico para cerrar el modal
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedItem(null);
        setItemType(null);
    };

    // FUNCIÓN ASÍNCRONA PARA BUSCAR NOMBRE DE USUARIO (USADA EN COMPATIBILIDAD)
    const fetchUserName = async (userId) => {
    if (!userId) return 'Usuario Desconocido (ID no provisto)';
    try {
        // 1. Crea una referencia al documento en la colección 'usuarios'
        const userDocRef = doc(db, 'usuarios', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            // 2. Retorna el nombre, el email o el ID (como fallback)
            return data.nombreCompleto || data.email || userId; 
        } else {
            return `Usuario Desconocido (${userId})`;
        }
    } catch (error) {
        console.error(`Error al obtener usuario ${userId}:`, error);
        return `Error al buscar usuario (${userId})`;
    }
};


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
            
            const rawPiezas = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            
            // Nuevo paso: Aplanar la estructura de datos
            const flatPiezas = rawPiezas.flatMap(pieza => {
                // Si 'campos' es un array válido y tiene elementos
                if (Array.isArray(pieza.campos) && pieza.campos.length > 0) {
                    return pieza.campos.map((campoItem, index) => ({
                        // 1. Datos de nivel superior
                        id: `${pieza.id}-${index}`, // ID ÚNICO para la fila: ID_Documento-Indice_Array
                        parentId: pieza.id, // Referencia al ID del documento de Firestore
                        nombre: pieza.nombre || '',
                        marca: pieza.marca || '',
                        modelo: pieza.modelo || '',
                        
                        // 2. Datos anidados del array 'campos'
                        campo: campoItem.campo || '',
                        codigo: campoItem.codigo || '',
                        codigoCompatibilidad: campoItem.codigoCompatibilidad || '',
                        
                        // 3. Índice original para el manejo de la edición
                        campoIndex: index 
                    }));
                }
                
                // Si la pieza no tiene campos, aún la incluimos (si es necesario) o la ignoramos.
                // Aquí la incluiremos como una sola fila 'vacía'.
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
            setPiezas(flatPiezas);
            const uniquePieceNames = [...new Set(flatPiezas.map(p => p.campo))].filter(Boolean); // Filtrar valores vacíos
            setPiezasNombre(uniquePieceNames);
            const uniqueMarcaNames = [...new Set(flatPiezas.map(p => p.marca))].filter(Boolean);
            setMarcaNames(uniqueMarcaNames);
        } catch (error) {
            console.error("Error al cargar piezas (tablas):", error);
            setPiezas([]); 
            setPiezasNombre([]);
        } finally {
            setLoading(false);
        }
    };
    fetchPiezas();
}, []);

  
    // 3. Carga de Estudios
    useEffect(() => {
        const fetchEstudios = async () => {
            setLoading(true);
            try {
                // Asumo una colección 'estudios' con documentos que tienen un campo 'nombre' y 'descripcion'
                const querySnapshot = await getDocs(collection(db, 'estudios'));
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEstudios(data);
            } catch (error) {
                console.error("Error al cargar estudios:", error);
                setEstudios([]);
            } finally {
                setLoading(false);
            }
        };
        fetchEstudios();
    }, []);

    // 4. Carga de Compatibilidad (Datos crudos)
    useEffect(() => {
        const fetchCompatibilidad = async () => {
            setLoading(true);
            try {
                // Colección 'sugerenciasPiezas'
                const querySnapshot = await getDocs(collection(db, 'sugerenciasPiezas'));
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCompatibilidad(data);
            } catch (error) {
                console.error("Error al cargar compatibilidad:", error);
                setCompatibilidad([]);
            } finally {
                setLoading(false);
            }
        };
        fetchCompatibilidad();
    }, []);
    

    // 5. Proceso de Decoración de Compatibilidad
    useEffect(() => {
    const decorateCompatibilidad = async () => {
        if (compatibilidad.length === 0) {
            setDecoratedCompatibilidad([]);
            return;
        }

        const decoratedData = await Promise.all(compatibilidad.map(async (item) => {
            // Se asume que el campo es 'idUsuario' o 'userId'
            const userId = item.idUsuario || item.userId; 
            
            // 1. Llama a la función para resolver el nombre
            const nombreUsuario = await fetchUserName(userId);

            // 2. Devuelve un nuevo objeto con el nombre y un campo de visualización
            return {
                ...item,
                nombreUsuario: nombreUsuario, // Nuevo campo
                // Este es el campo que se muestra en la DataCard
                displayText: `${nombreUsuario} - ${item.nombreCelular || 'Celular Desconocido'} - ${item.modelo || 'Modelo Desconocido'}`,
            };
        }));
        
        setDecoratedCompatibilidad(decoratedData);
    };

    decorateCompatibilidad();
}, [compatibilidad]);
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

        // ... (Bloque de validaciones)
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
            // ... (Fin de validaciones)

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
            Swal.fire({
                title: '¡Actualizado!',
                text: 'Los datos del usuario fueron actualizados.',
                icon: 'success',
                background: '#052b27ff',
                color: '#ffff',
                confirmButtonColor: '#07433E',
            });
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
    
   const handleEditPieza = (flatPiezaItem) => {
    const nombreCelular = flatPiezaItem.nombre || ''; 
    const modelo = flatPiezaItem.modelo || '';     

    const combinedQuery = `${nombreCelular} ${modelo}`.trim();

    if (combinedQuery) {
        
        // Codificar la única cadena combinada
        const queryTerm = encodeURIComponent(combinedQuery);

        // 2. Navegar con UN SOLO parámetro de consulta: 'query'
        navigate(`/TablaCel?query=${queryTerm}`);
    } else {
        console.error("No se pudo generar la cadena de búsqueda combinada.");
        return;
    }
};
    const handleDeletePiezaReal = async (id) => {
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
                // Notar que el ID que recibe es el parentId (el ID del documento principal)
                await deleteDoc(doc(db, 'tablas', id)); 
                // Filtramos el estado local para eliminar todas las filas con ese parentId
                setPiezas(piezas.filter(p => p.parentId !== id));
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
    
    // ------------------------------------------------------------------
    // --- MANEJADORES DE ESTUDIO ---
    // ------------------------------------------------------------------
    
    // El 'item' es un documento completo de la colección 'estudios'
    const handleEditEstudio = (item) => {
        // Clonamos el objeto para evitar mutaciones directas del estado.
        setSelectedItem({ ...item }); 
        setItemType('estudio');
        setShowModal(true);
    };

    const handleEliminarEstudio = async (id) => {
        const result = await Swal.fire({
            title:"¿Estás Seguro?", 
            text: "¡Eliminarás este Material de Estudio!", 
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
                await deleteDoc(doc(db, 'estudios', id));
                setEstudios(estudios.filter(e => e.id !== id));
                Swal.fire('Eliminado', 'Material de estudio eliminado correctamente.', 'success');
            } catch (error) {
                console.error("Error al eliminar estudio:", error);
                Swal.fire('Error', 'No se pudo eliminar el material de estudio.', 'error');
            }
        }
    };
    
    const handleSaveChangesEstudio = async () => {
        if (!selectedItem || itemType !== 'estudio') return;

        if (!selectedItem.nombre || !selectedItem.descripcion) {
            Swal.fire({ title:"Campos incompletos", text: "Todos los campos deben ser llenados.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff', });
            return;
        }

        try {
            const estudioRef = doc(db, 'estudios', selectedItem.id);
            await updateDoc(estudioRef, {
                nombre: selectedItem.nombre,
                descripcion: selectedItem.descripcion,
                // Agrega otros campos relevantes
            });

            // Actualiza el estado local
            setEstudios(estudios.map(e =>
                e.id === selectedItem.id ? selectedItem : e
            ));

            handleCloseModal();
            Swal.fire('Actualizado', 'Los datos del estudio fueron actualizados.', 'success');
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo actualizar el estudio.', 'error');
        }
    };

    const handleModalChangeEstudio = (e) => {
        const { name, value } = e.target;
        setSelectedItem((prev) => ({ ...prev, [name]: value }));
    };

    // ------------------------------------------------------------------
    // --- MANEJADORES DE COMPATIBILIDAD ---
    // ------------------------------------------------------------------
    const handleModalChangeCompatibilidad = (e) => {
        const { name, value } = e.target;
        setSelectedItem((prev) => ({ ...prev, [name]: value }));
    };
    // El 'item' es un documento completo de la colección 'compatibilidad'
    const handleEditCompatibilidad = (item) => {
        setSelectedItem({ ...item }); 
        setItemType('compatibilidad');
        setShowModal(true);
        
    };

    const handleEliminarCompatibilidad = async (id) => {
        const result = await Swal.fire({
            title:"¿Estás Seguro?", 
            text: "¡Eliminarás este registro de Compatibilidad!", 
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
                // Asumiendo que la colección es 'sugerenciasPiezas'
                await deleteDoc(doc(db, 'sugerenciasPiezas', id));
                // Actualizamos ambos estados
                setCompatibilidad(compatibilidad.filter(c => c.id !== id));
                setDecoratedCompatibilidad(decoratedCompatibilidad.filter(c => c.id !== id));
                Swal.fire('Eliminado', 'Registro de compatibilidad eliminado correctamente.', 'success');
            } catch (error) {
                console.error("Error al eliminar compatibilidad:", error);
                Swal.fire('Error', 'No se pudo eliminar el registro de compatibilidad.', 'error');
            }
        }
    };
    
   const handleSaveChangesCompatibilidad = async () => {
        if (!selectedItem || itemType !== 'compatibilidad') return;

        const requiredFields = [
               { name: 'estado', label: 'Estado', minLength: 1 },
            { name: 'nombreCelular', label: 'Nombre Celular', minLength: 3 },
            { name: 'marca', label: 'Marca (Origen)', minLength: 2 },
            { name: 'modelo', label: 'Modelo (Origen)', minLength: 1 },
            { name: 'pieza', label: 'Pieza', minLength: 3 },
            { name: 'adaptableMarca', label: 'Marca (Adaptable)', minLength: 2 },
            { name: 'adaptableModelo', label: 'Modelo (Adaptable)', minLength: 1 },
        ];
        let missingFields = [];
        requiredFields.forEach(field => {
            const value = selectedItem[field.name] ? String(selectedItem[field.name]).trim() : '';
            
            // Criterio de "vacío" o "seleccionar"
            if (!value || value === 'Seleccionar' || value === 'Otro' || value.length < field.minLength) {
                missingFields.push(field.label);
            }
        });

        if (missingFields.length > 0) {
            Swal.fire({ 
                title:"Campos incompletos", 
                text: `Por favor, llenar todos los campos necesarios`, 
                icon: "error", 
                background: '#052b27ff', 
                color: '#ffdfdfff', 
                confirmButtonColor: '#0b6860ff', 
            });
            return; // Detiene la ejecución si falta un campo
        }

        try {
            const compatibilidadRef = doc(db, 'sugerenciasPiezas', selectedItem.id);
            
            // 💡 CAMBIO: Definir los campos que se van a actualizar (excluyendo userId, urlImage y fechaSugerencia)
            const updateData = {
                adaptableMarca: selectedItem.adaptableMarca || '',
                adaptableModelo: selectedItem.adaptableModelo || '',
                comentarios: selectedItem.comentarios || '',
                estado: selectedItem.estado || 'pendiente',
                marca: selectedItem.marca || '',
                modelo: selectedItem.modelo || '',
                nombreCelular: selectedItem.nombreCelular || '',
                pieza: selectedItem.pieza || '',
            };
            
            await updateDoc(compatibilidadRef, updateData);

            // Actualizar el estado local (decoratedCompatibilidad) para reflejar los cambios en la UI
            const updatedDecoratedItem = {
                ...selectedItem,
                ...updateData, // Asegura que los campos actualizados se incluyan
                // Regenerar el displayText por si cambia el modelo/nombreCelular
                displayText: `${selectedItem.nombreUsuario || selectedItem.userId} - ${updateData.nombreCelular || 'Celular Desconocido'} - ${updateData.modelo || 'Modelo Desconocido'}`,
            };
            
            setDecoratedCompatibilidad(prev => prev.map(c => 
                c.id === selectedItem.id ? updatedDecoratedItem : c
            ));
            
            // Actualizar el estado crudo (compatibilidad)
            setCompatibilidad(prev => prev.map(c => 
                c.id === selectedItem.id ? { ...c, ...updateData } : c
            ));

            handleCloseModal();
            Swal.fire({
                title: '¡Guardado!',
                text: 'Sugerencia actualizada y lista para procesamiento.',
                icon: 'success',
                background: '#052b27ff',
                color: '#ffff',
                confirmButtonColor: '#07433E',
            });
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo actualizar el registro de compatibilidad.', 'error');
        }
    };
    
    // ------------------------------------------------------------------
    // --- RENDERIZADO DEL MODAL ---
    // ------------------------------------------------------------------

    const renderModalBody = () => {
        if (!selectedItem) return null;
        const pieceOptions = piezasNombre;
        const isRegisteredPiece = pieceOptions.some(p => p === selectedItem.pieza);
    
        const isCustomPiece = selectedItem.pieza && 
                            selectedItem.pieza !== 'Seleccionar' && 
                            selectedItem.pieza !== 'Otro' &&
                            !isRegisteredPiece;

        const selectPieceValue = isCustomPiece ? 'Otro' : (selectedItem.pieza || 'Seleccionar');

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
                            onChange={handleModalChangeUser}
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
        } else if (itemType === 'estudio') {
             return (
                <Form>
                    <Form.Group className="mb-2">
                        <Form.Label>Nombre del Estudio</Form.Label>
                        <Form.Control
                            type="text"
                            name="nombre"
                            value={selectedItem.nombre || ''}
                            onChange={handleModalChangeEstudio}
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="descripcion"
                            value={selectedItem.descripcion || ''}
                            onChange={handleModalChangeEstudio}
                        />
                    </Form.Group>
                    {/* Agrega más campos si es necesario */}
                </Form>
            );
        }else if (itemType === 'compatibilidad') {
         const formatFecha = (timestamp) => {
        if (!timestamp) return 'N/A';
        
        let dateValue;

        if (typeof timestamp === 'string' && timestamp.startsWith('Timestamp(seconds=')) {
            const match = timestamp.match(/seconds=(\d+)/); 
            if (match && match[1]) {
                const seconds = parseInt(match[1], 10);
                dateValue = new Date(seconds * 1000); 
            }
        } else if (timestamp.seconds !== undefined) {
             dateValue = new Date(timestamp.seconds * 1000);
        } else {
            const numericTimestamp = parseFloat(timestamp);
            if (!isNaN(numericTimestamp) && numericTimestamp > 1000000000) { 
                const ms = Math.floor(numericTimestamp * 1000);
                dateValue = new Date(ms);
            } else if (typeof timestamp === 'string') {
                dateValue = new Date(timestamp);
            } else {
                 return String(timestamp);
            }
        }

        // 4. Validación y Formato
        if (dateValue && !isNaN(dateValue.getTime())) {
            
            // CAMBIO CRÍTICO AQUÍ: Definir opciones para el formato DD/MM/AAAA H:MM
            const dateOptions = {
                day: '2-digit',      // DD
                month: '2-digit',    // MM
                year: 'numeric',     // AAAA
                hour: 'numeric',     // H
                minute: '2-digit',   // MM
                hour12: true     
            };
            return dateValue.toLocaleDateString('es-ES', dateOptions); 
        }

        return String(timestamp); 
    };
    
    const fechaFormateada = formatFecha(selectedItem.fechaSugerencia);

        const marcaOptions = marcaNames; // o el estado que uses para las marcas
        
        // 1. Verificar si la marca cargada está registrada
        const isRegisteredMarca = marcaOptions.some(m => m === selectedItem.marca);
        
        // 2. Determinar si es una marca personalizada/no registrada
        const isCustomMarca = selectedItem.marca && 
                              selectedItem.marca !== 'Seleccionar' && 
                              selectedItem.marca !== 'Otro' &&
                              !isRegisteredMarca;

        // 3. Determinar el valor que debe tener el SELECT
        const selectMarcaValue = isCustomMarca ? 'Otro' : (selectedItem.marca || 'Seleccionar');

        const isRegisteredAdaptableMarca = marcaOptions.some(m => m === selectedItem.adaptableMarca);

        // 2. Determinar si es una marca adaptable personalizada/no registrada
        const isCustomAdaptableMarca = selectedItem.adaptableMarca && 
                            selectedItem.adaptableMarca !== 'Seleccionar' && 
                            selectedItem.adaptableMarca !== 'Otro' &&
                            !isRegisteredAdaptableMarca;

        // 3. Determinar el valor que debe tener el SELECT de Marca Adaptable
        const selectAdaptableMarcaValue = isCustomAdaptableMarca 
            ? 'Otro' 
            : (selectedItem.adaptableMarca || 'Seleccionar');
            return (
                <Form>
                    {/* Campos de Solo Lectura */}
                    <h6 className="mt-3 mb-2">Detalles de la Sugerencia</h6>
                    <div className="d-flex justify-content-between mb-3">
                        <Form.Group className="mb-2">
                            <Form.Label>Sugerencia Por:</Form.Label>
                            <Form.Control 
                                type="text" 
                                // Muestra el nombre resuelto o el ID
                                value={selectedItem.nombreUsuario || selectedItem.userId || ''} 
                                disabled 
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Fecha Sugerencia</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={fechaFormateada} 
                                disabled
                            />
                        </Form.Group>
                        
                    </div>
                    {/* Comentarios */}
                    <Form.Group className="mb-2">
                        <Form.Label>Comentarios</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            name="comentarios"
                            value={selectedItem.comentarios || ''}
                            onChange={handleModalChangeCompatibilidad}
                            disabled
                        />
                    </Form.Group>

                    <hr/>
                    <h6 className="mt-3 mb-2">Datos Editables de la pieza sugerida</h6>
                    
                    {/* Estado */}
                    <Form.Group className="mb-2">
                        <Form.Label>Estado</Form.Label>
                        <Form.Select
                            name="estado"
                            value={selectedItem.estado || 'pendiente'}
                            onChange={handleModalChangeCompatibilidad}
                        >
                            <option value="pendiente">Pendiente</option>
                            <option value="aceptado">Aceptado</option>
                            <option value="rechazado">Rechazado</option>
                            <option value="en_revision">En Revisión</option>
                        </Form.Select>
                    </Form.Group>

                    {/* Nombre Celular y Marca (Original) */}
                    <div className="d-flex justify-content-between">
                        <Form.Group className="mb-2 w-50 pe-2">
                            <Form.Label>Nombre Celular </Form.Label>
                            <Form.Control
                                type="text"
                                name="nombreCelular"
                                value={selectedItem.nombreCelular || ''}
                                onChange={handleModalChangeCompatibilidad}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2 w-50 ps-2">
                        <Form.Label>Marca </Form.Label>
                        <Form.Select
                            name="marca" // Importante mantener 'marca'
                            value={selectMarcaValue} // Usamos el valor calculado
                            onChange={handleModalChangeCompatibilidad}
                        >
                            <option value="Seleccionar">Seleccionar</option>
                            {/* Renderizar opciones desde la BD (uniqueMarcaNames) */}
                            {marcaOptions.map((marcaName, index) => (
                                <option key={index} value={marcaName}>
                                    {marcaName}
                                </option>
                            ))}
                            <option value="Otro">Otro</option>
                        </Form.Select>

                        {/* Campo de texto condicional para "Otro" o marca no registrada */}
                        {(selectMarcaValue === 'Otro' || isCustomMarca) && (
                            <Form.Control
                                className="mt-2"
                                type="text"
                                name="marca" // Importante: mantiene el nombre para actualizar el mismo campo
                                // Mostrar el valor real o vacío si recién se selecciona "Otro"
                                value={selectedItem.marca === 'Otro' ? '' : selectedItem.marca || ''}
                                placeholder="Escriba la marca aqui"
                                onChange={handleModalChangeCompatibilidad}
                            />
                        )}
                    </Form.Group>
                    </div>
                    
                    {/* Modelo y Pieza (Original) */}
                    <div className="d-flex justify-content-between">
                        <Form.Group className="mb-2 w-50 pe-2">
                            <Form.Label>Modelo </Form.Label>
                            <Form.Control
                                type="text"
                                name="modelo"
                                value={selectedItem.modelo || ''}
                                onChange={handleModalChangeCompatibilidad}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2 w-50 ps-2">
                        <Form.Label>Pieza</Form.Label>
                        <Form.Select
                            name="pieza"
                            value={selectPieceValue} // Usamos el valor calculado
                            onChange={handleModalChangeCompatibilidad}
                        >
                            <option value="Seleccionar">Seleccionar</option>
                            {/* Renderizar opciones desde la BD (usando pieceOptions) */}
                            {pieceOptions.map((pieceName, index) => (
                                <option key={index} value={pieceName}>
                                    {pieceName}
                                </option>
                            ))}
                            <option value="Otro">Otro</option>
                        </Form.Select>

                        {/* Campo de texto condicional para "Otro" o pieza no registrada */}
                        {(selectPieceValue === 'Otro' || isCustomPiece) && (
                            <Form.Control
                                className="mt-2"
                                type="text"
                                name="pieza" 
                                value={selectedItem.pieza === 'Otro' ? '' : selectedItem.pieza || ''}
                                placeholder="Escriba la pieza aqui"
                                onChange={handleModalChangeCompatibilidad}
                            />
                        )}
                    </Form.Group>
                    </div>
                    
                    <hr/>
                    <h6 className="mt-3 mb-2" >Compatible con:</h6>

                    {/* Adaptable Marca/Modelo */}
                    <div className="d-flex justify-content-between">
                        <Form.Group className="mb-2 w-50 pe-2">
                            <Form.Label>Marca</Form.Label>
                            <Form.Select
                                name="adaptableMarca" // Importante: actualiza el campo correcto
                                value={selectAdaptableMarcaValue}
                                onChange={handleModalChangeCompatibilidad}
                            >
                                <option value="Seleccionar">Seleccionar</option>
                                {/* Renderizar opciones desde la BD (uniqueMarcaNames) */}
                                {marcaOptions.map((marcaName, index) => (
                                    <option key={index} value={marcaName}>
                                        {marcaName}
                                    </option>
                                ))}
                                <option value="Otro">Otro </option>
                            </Form.Select>

                            {/* Campo de texto condicional para "Otro" o marca no registrada */}
                            {(selectAdaptableMarcaValue === 'Otro' || isCustomAdaptableMarca) && (
                                <Form.Control
                                    className="mt-2"
                                    type="text"
                                    name="adaptableMarca" // ¡Actualiza el campo adaptableMarca!
                                    // Mostrar el valor real o vacío si recién se selecciona "Otro"
                                    value={selectedItem.adaptableMarca === 'Otro' ? '' : selectedItem.adaptableMarca || ''}
                                    placeholder="Escriba la marca aqui"
                                    onChange={handleModalChangeCompatibilidad}
                                />
                            )}
                        </Form.Group>
                        <Form.Group className="mb-2 w-50 ps-2">
                            <Form.Label>Modelo</Form.Label>
                            <Form.Control
                                type="text"
                                name="adaptableModelo"
                                value={selectedItem.adaptableModelo || ''}
                                onChange={handleModalChangeCompatibilidad}
                            />
                        </Form.Group>
                    </div>

                    
                </Form>
            );
        }
        return null;
    };
    
    // Asignación dinámica de la función de guardado
    const handleSave = itemType === 'usuario' ? handleSaveChangesUser : 
                       itemType === 'estudio' ? handleSaveChangesEstudio :
                       itemType === 'compatibilidad' ? handleSaveChangesCompatibilidad :
                       () => alert('Función de guardado no definida');
                       
    // Asignación dinámica del título del modal
    const modalTitle = itemType === 'usuario' ? 'Editar Usuario': 
                       itemType === 'estudio' ? 'Editar Material de Estudio' :
                       itemType === 'compatibilidad' ? 'Editar Registro de Compatibilidad' :
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
                            link={'/gestionUsuarios'}
                            linkNuevo={'/nuevoUsuario'}
                            showNewButton={true}
                        />
                        
                        {/* 2. SECCIÓN PIEZAS  */}
                        <DataCard
                            title="Celulares y Partes"
                            icon={IconoPieza}
                            data={piezas}
                            searchQuery={searchQueryPiezas}
                            setSearchQuery={setSearchQueryPiezas} 
                            collectionName="piezas"
                            handleEdit={handleEditPieza}
                            handleDelete={handleDeletePiezaReal}
                            link={'/gestionPiezas'}
                            linkNuevo={'/TablaCel'}
                            showNewButton={true}
                        />
                        
                        {/* 3. SECCIÓN M. ESTUDIO  */}
                        <DataCard
                            title="M. Estudio"
                            icon={IconoLibro}
                            data={estudios} 
                            searchQuery={searchQueryEstudios}
                            setSearchQuery={setSearchQueryEstudios}
                            collectionName="estudios"
                            handleEdit={handleEditEstudio} 
                            handleDelete={handleEliminarEstudio} 
                            link={'/gestionEstudios'}
                            linkNuevo={'/nuevoEstudio'} 
                            showNewButton={true}
                        />
                        <div className="grid-full-width">
                        {/* 4. SECCIÓN COMPATIBILIDAD  */}
                        <DataCard
                            title="Sugerencias de Compatibilidad"
                            icon={IconoPieza} 
                            data={decoratedCompatibilidad} 
                            searchQuery={searchQueryCompatibilidad}
                            setSearchQuery={setSearchQueryCompatibilidad}
                            collectionName="compatibilidad"
                            handleEdit={handleEditCompatibilidad} 
                            handleDelete={handleEliminarCompatibilidad} 
                            link={'/gestionSugerencias'}
                            showNewButton={false}
                        />
                        </div>
                    </div>
                </div>
            </main>
            <Footer/>

            {/* Modal de Edición Universal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {renderModalBody()}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cerrar
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Guardar Cambios
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default GestionAdminPage;