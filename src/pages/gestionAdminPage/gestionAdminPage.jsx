import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, getDoc} from 'firebase/firestore';
import { getStorage, ref as storageRef, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { Modal, Form, Button } from 'react-bootstrap'; 
import {FaPlus} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { db } from '../../firebase';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';
import IconoEditar from '../../assets/Iconos/iconoEditar.png';
import IconoEliminar from '../../assets/Iconos/iconoEliminar.png';
import IconoPieza from '../../assets/Iconos/iconoPieza.png';
import IconoLibro from '../../assets/Iconos/iconoLibro.png';
import IconoUsuario from '../../assets/Iconos/usuario2.png';
import IconoGrabadora from '../../assets/Iconos//iconograbadora.png';
import './gestionAdminPage.css'; 

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
            // Si es un valor simple, se agrega.
            parts.push(normalizeString(v));
            
        } else if (Array.isArray(v)) {
            v.forEach(helper);
            
        } else if (t === 'object') {
            Object.values(v).forEach(helper);
        }
    };
    
    helper(value);
    return parts.join(' '); 
};

// DataCard reutilizable para cada tabla de gestión

const DataCard = ({ title, icon, data, searchQuery, setSearchQuery, collectionName, handleEdit, handleDelete, link, linkNuevo, showNewButton }) => {
    const [isSearchVisible, setIsSearchVisible] = useState(false); 
    const filteredData = data.filter((item) => {
        const q = (searchQuery || '').toLowerCase().trim();
        if (!q) return true;
        const hayTexto = extractTextForSearch(item);
        const qlTerms = q.split(' ').filter(term => term.length > 0);
        return qlTerms.every(term => hayTexto.includes(term));
    });

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
        // CONTENEDOR PRINCIPAL QUE GESTIONA LA SEPARACIÓN 
        <div className="admin-card-wrapper">
            <div className="admin-card">
                <div className="card-header-admin">
                    {/* Contenido del Header*/}
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
                
                {/* Contenido del Cuerpo*/}
                <div className="card-list">
                    {filteredData.slice(0, 4).map((item) => (
                        <div key={item.id} className="list-item">
                            <span className="item-text">
                                {
                                  collectionName === 'usuarios' ? (item.nombreCompleto || item.email || item.id) : 
                                  collectionName === 'piezas' ? `${item.nombre || item.id} ${item.campo ? ' - ' + item.campo : ''}` :
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

            {/* Footer de la carta */}
            <div className="card-footer-admin">
                <button className="btn-ver-mas" onClick={() => navigate(link)}>
                   <span className='chevM'/> Ver más
                </button>
            </div>
            <div className="count-info-box"> 
                 <div className="count-info">
                    <span className="count-number">{data.length}</span> {title} Registrados
                </div>
            </div>

        </div>
    );
};

function GestionAdminPage() {
    const navigate = useNavigate();
    // Estados de Usuarios
    const [usuarios, setUsuarios] = useState([]);
    const [searchQueryUsuarios, setSearchQueryUsuarios] = useState('');
    // Estados para otras colecciones
    const [piezas, setPiezas] = useState([]);
    const [piezasNombre, setPiezasNombre] = useState([]);
    const [marcaNames, setMarcaNames] = useState([]);
    const [searchQueryPiezas, setSearchQueryPiezas] = useState('');
    // Estados de Material de Estudio
    const [estudios, setEstudios] = useState([]); 
    const [searchQueryEstudios, setSearchQueryEstudios] = useState('');
    // Estados de Material de Noticias
    const [noticia, setNoticia] = useState([]);
    const [searchQueryNoticia, setSearchQueryNoticia] = useState('');
    //Estados de SugerenciasCompatibilidad
    const [compatibilidad, setCompatibilidad] = useState([]);
    const [searchQueryCompatibilidad, setSearchQueryCompatibilidad] = useState('');
    const [decoratedCompatibilidad, setDecoratedCompatibilidad] = useState([]); 
    // Estados para Edición/Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); 
    const [itemType, setItemType] = useState(null); 
    
    // Cerrar Modal
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedItem(null);
        setItemType(null);
    };

    // Función para buscar nombre de usuario
    const fetchUserName = async (userId) => {
        if (!userId) return 'Usuario Desconocido (ID no provisto)';
        try {
            const userDocRef = doc(db, 'usuarios', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const data = userDoc.data();
                return data.nombreCompleto || data.email || userId; 
            } else {
                return `Usuario Desconocido (${userId})`;
            }
        } catch (error) {
            console.error(`Error al obtener usuario ${userId}:`, error);
            return `Error al buscar usuario (${userId})`;
        }
    };


    // Carga de Usuarios
    useEffect(() => {
        const fetchUsuarios = async () => {
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
            }
        };
        fetchUsuarios();
    }, []);

    // Carga de Piezas
    useEffect(() => {
        const fetchPiezas = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'tablas')); 
                const rawPiezas = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const flatPiezas = rawPiezas.flatMap(pieza => {
                    if (Array.isArray(pieza.campos) && pieza.campos.length > 0) {
                        return pieza.campos.map((campoItem, index) => ({
                            id: `${pieza.id}-${index}`,
                            parentId: pieza.id,
                            nombre: pieza.nombre || '',
                            marca: pieza.marca || '',
                            modelo: pieza.modelo || '',
                            
                            campo: campoItem.campo || '',
                            codigo: campoItem.codigo || '',
                            codigoCompatibilidad: campoItem.codigoCompatibilidad || '',
                            
                            campoIndex: index 
                        }));
                    }
                    
                    // Si la pieza no tiene campos, se ignora.
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
                const uniquePieceNames = [...new Set(flatPiezas.map(p => p.campo))].filter(Boolean); 
                setPiezasNombre(uniquePieceNames);
                const uniqueMarcaNames = [...new Set(flatPiezas.map(p => p.marca))].filter(Boolean);
                setMarcaNames(uniqueMarcaNames);
            } catch (error) {
                console.error("Error al cargar piezas (tablas):", error);
                setPiezas([]); 
                setPiezasNombre([]);
            }
        };
        fetchPiezas();
    }, []);

  
    // Carga de Estudios
    useEffect(() => {
        const fetchEstudios = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'estudios'));
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEstudios(data);
            } catch (error) {
                console.error("Error al cargar estudios:", error);
                setEstudios([]);
            }
        };
        fetchEstudios();
    }, []);

    // Carga de Noticias
    useEffect(() => {
        const fetchNoticia = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'materialNoticias'));
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setNoticia(data);
            } catch (error) {
                console.error("Error al cargar Noticias:", error);
                setNoticia([]);
            }
        };
        fetchNoticia();
    }, []);

    // Carga de Sugerencias de Compatibilidad
    useEffect(() => {
        const fetchCompatibilidad = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'sugerenciasPiezas'));
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCompatibilidad(data);
            } catch (error) {
                console.error("Error al cargar compatibilidad:", error);
                setCompatibilidad([]);
            }
        };
        fetchCompatibilidad();
    }, []);
    

    // Proceso de Decoración de Compatibilidad
    useEffect(() => {
        const decorateCompatibilidad = async () => {
            if (compatibilidad.length === 0) {
                setDecoratedCompatibilidad([]);
                return;
            }

            const decoratedData = await Promise.all(compatibilidad.map(async (item) => {
                const userId = item.idUsuario || item.userId; 
                const nombreUsuario = await fetchUserName(userId);
                return {
                    ...item,
                    nombreUsuario: nombreUsuario, 
                    displayText: `${nombreUsuario} - ${item.nombreCelular || 'Celular Desconocido'} - ${item.modelo || 'Modelo Desconocido'}`,
                };
            }));
            
            setDecoratedCompatibilidad(decoratedData);
        };

        decorateCompatibilidad();
    }, [compatibilidad]);
 
    // MANEJO DE USUARIOS
    const handleEditUser = (user) => {
        setSelectedItem({
            ...user,
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
                    confirmButtonColor: '#0b6860ff'
                });
            }
        }
    };

    const MIN_AGE = 1;
    const MAX_AGE = 120;
    const validateAge = (birthDateString) => {
      if (!birthDateString) return false;
      const birthDate = new Date(birthDateString);
      const today = new Date();
      // Calcula la diferencia en milisegundos
      const ageInMilliseconds = today.getTime() - birthDate.getTime();
      // Convierte milisegundos a años
      const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
      return ageInYears >= MIN_AGE && ageInYears <= MAX_AGE;
    };

    const handleSaveChangesUser = async () => {
        if (!selectedItem || itemType !== 'usuario') return;
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
                 if (!validateAge(selectedItem.fechaNacimiento)) {
                    Swal.fire({title: "Error",text: `La fecha de nacimiento es invalida.`,icon: "error",background: '#052b27ff',color: '#ffdfdfff',confirmButtonColor: '#0b6860ff',});
                    return;
                }
            }

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

    // MANEJO DE PIEZAS
    const handleEditPieza = (flatPiezaItem) => {
        const nombreCelular = flatPiezaItem.nombre || ''; 
        const modelo = flatPiezaItem.modelo || '';
        const combinedQuery = `${nombreCelular} ${modelo}`.trim();

        if (combinedQuery) {
            const queryTerm = encodeURIComponent(combinedQuery);
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
                await deleteDoc(doc(db, 'tablas', id)); 
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
    
    // MANEJO DE ESTUDIOS
    const handleEditEstudio = (item) => {
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
                const estudioDocRef = doc(db, 'estudios', id);
                const estudioSnap = await getDoc(estudioDocRef);
                if (estudioSnap.exists()) {
                    const estudioData = estudioSnap.data();
                    if (estudioData.storagePath) {
                        try {
                            const storage = getStorage();
                            const fileRef = storageRef(storage, estudioData.storagePath);
                            await deleteObject(fileRef);
                        } catch (err) {
                            console.warn('No se pudo eliminar el archivo en Storage (puede que no exista):', err);
                        }
                    }
                }

                await deleteDoc(estudioDocRef);
                setEstudios(estudios.filter(e => e.id !== id));
                Swal.fire({ title:"Eliminado", text: "Material de estudio eliminado correctamente", icon: "success", background: '#052b27ff', color: '#ffffffff', confirmButtonColor: '#0b6860ff' });
            } catch (error) {
                console.error("Error al eliminar estudio:", error);
                Swal.fire({ title:"Error", text: "No se pudo eliminar el material de estudio.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff'});
            }
        }
    };
    
    const handleSaveChangesEstudio = async () => {
        if (!selectedItem || itemType !== 'estudio') return;

        if (!selectedItem.nombre || !selectedItem.descripcion || !selectedItem.url) {
            Swal.fire({ title:"Campos incompletos", text: "Todos los campos deben ser llenados.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff' });
            return;
        }

        let downloadURL = selectedItem.url;  
        try {
            const estudioRef = doc(db, 'estudios', selectedItem.id);
            const updatePayload = {
                nombre: selectedItem.nombre,
                descripcion: selectedItem.descripcion,
                tipo: selectedItem.tipo || '',
                url: downloadURL || '', 
                fecha: selectedItem.fecha || ''
            };        
            await updateDoc(estudioRef, updatePayload);

            setEstudios(estudios.map(e =>
                e.id === selectedItem.id 
                    ? { ...e, ...updatePayload }
                : e
            ));
            if (itemType === 'estudio') {
                setSelectedItem(prev => ({ ...prev, ...updatePayload }));
            }
            handleCloseModal();

            Swal.fire({ title:"Actualizado", text: "Los datos del estudio fueron actualizados.", icon: "success", background: '#052b27ff', color: '#ffffffff', confirmButtonColor: '#0b6860ff' });
        } catch (error) {
            console.error(error);
            Swal.fire({ title:"Error", text: "No se pudo actualizar el estudio.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff' });
        }
    };

    const handleModalChangeEstudio = (e) => {
        const { name, value } = e.target;
        setSelectedItem((prev) => ({ ...prev, [name]: value }));
    };

    // MANEJO DE SUGERENCIAS DE COMPATIBILIDAD
    const handleModalChangeCompatibilidad = (e) => {
        const { name, value } = e.target;
        setSelectedItem((prev) => ({ ...prev, [name]: value }));
    };

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
                await deleteDoc(doc(db, 'sugerenciasPiezas', id));
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
            return;
        }

        try {
            const compatibilidadRef = doc(db, 'sugerenciasPiezas', selectedItem.id);
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
            const updatedDecoratedItem = {
                ...selectedItem,
                ...updateData, 
                displayText: `${selectedItem.nombreUsuario || selectedItem.userId} - ${updateData.nombreCelular || 'Celular Desconocido'} - ${updateData.modelo || 'Modelo Desconocido'}`,
            };
            
            setDecoratedCompatibilidad(prev => prev.map(c => 
                c.id === selectedItem.id ? updatedDecoratedItem : c
            ));
            
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

    // MANEJO DE NOTICIAS
    const handleEliminarNoticia= async (id) => {
        const result = await Swal.fire({
            title:"¿Estás Seguro?", 
            text: "¡Eliminarás esta Noticia!", 
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
                const noticiaDocRef = doc(db, 'materialNoticias', id);
                const noticiaSnap = await getDoc(noticiaDocRef);
                if (noticiaSnap.exists()) {
                    const noticiaData = noticiaSnap.data();
                    if (noticiaData.storagePath) {
                        try {
                            const storage = getStorage();
                            const fileRef = storageRef(storage, noticiaData.storagePath);
                            await deleteObject(fileRef);
                        } catch (err) {
                            console.warn('No se pudo eliminar el archivo en Storage (puede que no exista):', err);
                        }
                    }
                }

                await deleteDoc(noticiaDocRef);
                setNoticia(noticia.filter(e => e.id !== id));
                Swal.fire({ title:"Eliminado", text: "Noticia eliminad correctamente", icon: "success", background: '#052b27ff', color: '#ffffffff', confirmButtonColor: '#0b6860ff' });
            } catch (error) {
                console.error("Error al eliminar estudio:", error);
                Swal.fire({ title:"Error", text: "No se pudo eliminar el material de estudio.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff'});
            }
        }
    };

    const handleSaveChangesNoticias = async () => {
        if (!selectedItem || itemType !== 'noticia') return;

        if (!selectedItem.nombre || !selectedItem.descripcion || !selectedItem.url) {
            Swal.fire({ title:"Campos incompletos", text: "Todos los campos deben ser llenados.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff' });
            return;
        }

        let downloadURL = selectedItem.url;    

        try {
            const noticiaRef = doc(db, 'materialNoticias', selectedItem.id);
                
            const updatePayload = {
                nombre: selectedItem.nombre,
                descripcion: selectedItem.descripcion,
                tipo: selectedItem.tipo || '',
                url: downloadURL || '', 
                fecha: selectedItem.fecha || ''
            };        
            await updateDoc(noticiaRef, updatePayload);

            setNoticia(noticia.map(e =>
                e.id === selectedItem.id 
                    ? { ...e, ...updatePayload } 
                : e
            ));

            if (itemType === 'noticia') {
                setSelectedItem(prev => ({ ...prev, ...updatePayload }));
             }
            handleCloseModal();

            Swal.fire({ title:"Actualizado", text: "Los datos del estudio fueron actualizados.", icon: "success", background: '#052b27ff', color: '#ffffffff', confirmButtonColor: '#0b6860ff' });
        } catch (error) {
            console.error(error);
            Swal.fire({ title:"Error", text: "No se pudo actualizar el estudio.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff' });
        }
    };

    const handleModalChangeNoticia = (e) => {
        const { name, value } = e.target;
        setSelectedItem((prev) => ({ ...prev, [name]: value }));
    };

     const handleEditNoticia = (item) => {
        setSelectedItem({ ...item }); 
        setItemType('noticia');
        setShowModal(true);
    };

    // Renderizacion del modal dependiendo de la tabla
    const renderModalBody = () => {
        if (!selectedItem) return null;
        const pieceOptions = piezasNombre;
        const isRegisteredPiece = pieceOptions.some(p => p === selectedItem.pieza);

        const isCustomPiece = selectedItem.pieza && selectedItem.pieza !== 'Seleccionar' && selectedItem.pieza !== 'Otro' && !isRegisteredPiece;
        const selectPieceValue = isCustomPiece ? 'Otro' : (selectedItem.pieza || 'Seleccionar');

        if (itemType === 'usuario') {
            return (
                <Form>
                    <Form.Group className="mb-2">
                        <Form.Label>Nombres Completo</Form.Label>
                        <Form.Control
                            type="text"
                            name="nombreCompleto"
                            value={selectedItem.nombreCompleto || ''}
                            onChange={handleModalChangeUser}
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Teléfono</Form.Label>
                        <Form.Control
                            type="text"
                            name="telefono"
                            value={selectedItem.telefono || ''}
                            onChange={handleModalChangeUser}
                        />
                    </Form.Group>
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
                        <Form.Label>Nombre</Form.Label>
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
                    <Form.Group className="mb-2">
                        <Form.Label>Tipo</Form.Label>
                        <Form.Select name="tipo" value={selectedItem.tipo || 'video'} onChange={handleModalChangeEstudio} >
                            <option value="video">Video</option>
                            <option value="pdf">PDF</option>
                        </Form.Select>
                    </Form.Group>
                    {selectedItem.tipo === 'video' ? (
                        <Form.Group className="mb-2">
                            <Form.Label>Enlace del Video (URL)</Form.Label>
                            <Form.Control 
                            value={selectedItem.url || ''} 
                            onChange={(e) => setSelectedItem(s => ({ ...s, url: e.target.value }))} 
                            />
                            {selectedItem.url && (
                                <a className='login-invited-btn' href={selectedItem.url} target="_blank" rel="noreferrer">Ver recurso</a>
                            )}
                        </Form.Group>
                        ) : (
                        <>
                            <Form.Group className="mb-2">
                            <Form.Label>Enlace del PDF (URL) </Form.Label>
                            <Form.Control type="text" name="url" value={selectedItem.url || ''} onChange={(e) => setSelectedItem(s => ({ ...s, url: e.target.value }))} />
                            {selectedItem.url && (
                                <a className='login-invited-btn' href={selectedItem.url} target="_blank" rel="noreferrer">Ver recurso</a>
                            )}
                            </Form.Group>
                        </>
                    )}
                </Form>
            );
        }else if (itemType === 'noticia') {
            return (
                <Form>
                    <Form.Group className="mb-2">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                            type="text"
                            name="nombre"
                            value={selectedItem.nombre || ''}
                            onChange={handleModalChangeNoticia}
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="descripcion"
                            value={selectedItem.descripcion || ''}
                            onChange={handleModalChangeNoticia}
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Tipo</Form.Label>
                        <Form.Select name="tipo" value={selectedItem.tipo || 'video'} onChange={handleModalChangeNoticia} >
                            <option value="video">Video</option>
                            <option value="pdf">PDF</option>
                        </Form.Select>
                    </Form.Group>
                    {selectedItem.tipo === 'video' ? (
                        <Form.Group className="mb-2">
                            <Form.Label>Enlace del Video (URL)</Form.Label>
                            <Form.Control 
                            value={selectedItem.url || ''} 
                            onChange={(e) => setSelectedItem(s => ({ ...s, url: e.target.value }))} 
                            />
                            {selectedItem.url && (
                                <a className='login-invited-btn' href={selectedItem.url} target="_blank" rel="noreferrer">Ver recurso</a>
                            )}
                        </Form.Group>
                        ) : (
                        <>
                            <Form.Group className="mb-2">
                            <Form.Label>Enlace del PDF (URL) </Form.Label>
                            <Form.Control type="text" name="url" value={selectedItem.url || ''} onChange={(e) => setSelectedItem(s => ({ ...s, url: e.target.value }))} />
                            {selectedItem.url && (
                                <a className='login-invited-btn' href={selectedItem.url} target="_blank" rel="noreferrer">Ver recurso</a>
                            )}
                            </Form.Group>
                        </>
                    )}
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

                if (dateValue && !isNaN(dateValue.getTime())) {
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
            const marcaOptions = marcaNames; 
            
            //  Verificar si la marca cargada está registrada
            const isRegisteredMarca = marcaOptions.some(m => m === selectedItem.marca);
            const isCustomMarca = selectedItem.marca && selectedItem.marca !== 'Seleccionar' && selectedItem.marca !== 'Otro' && !isRegisteredMarca;
            // Determinar el valor que debe tener el SELECT
            const selectMarcaValue = isCustomMarca ? 'Otro' : (selectedItem.marca || 'Seleccionar');
            const isRegisteredAdaptableMarca = marcaOptions.some(m => m === selectedItem.adaptableMarca);

            const isCustomAdaptableMarca = selectedItem.adaptableMarca && selectedItem.adaptableMarca !== 'Seleccionar' && selectedItem.adaptableMarca !== 'Otro' && !isRegisteredAdaptableMarca;
            // Determinar el valor que debe tener el SELECT de Marca Adaptable
            const selectAdaptableMarcaValue = isCustomAdaptableMarca ? 'Otro' : (selectedItem.adaptableMarca || 'Seleccionar');

            return (
                <Form>
                    <h6 className="mt-3 mb-2">Detalles de la Sugerencia</h6>
                    <div className="d-flex justify-content-between mb-3">
                        <Form.Group className="mb-2">
                            <Form.Label>Sugerencia Por:</Form.Label>
                            <Form.Control 
                                type="text" 
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
                                name="marca" 
                                value={selectMarcaValue} 
                                onChange={handleModalChangeCompatibilidad}
                            >
                                <option value="Seleccionar">Seleccionar</option>
                                {marcaOptions.map((marcaName, index) => (
                                    <option key={index} value={marcaName}>
                                        {marcaName}
                                    </option>
                                ))}
                                <option value="Otro">Otro</option>
                            </Form.Select>
                            {(selectMarcaValue === 'Otro' || isCustomMarca) && (
                                <Form.Control
                                    className="mt-2"
                                    type="text"
                                    name="marca"
                                    value={selectedItem.marca === 'Otro' ? '' : selectedItem.marca || ''}
                                    placeholder="Escriba la marca aqui"
                                    onChange={handleModalChangeCompatibilidad}
                                />
                            )}
                        </Form.Group>
                    </div>
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
                                value={selectPieceValue} 
                                onChange={handleModalChangeCompatibilidad}
                            >
                                <option value="Seleccionar">Seleccionar</option>
                                {pieceOptions.map((pieceName, index) => (
                                    <option key={index} value={pieceName}>
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
                                    value={selectedItem.pieza === 'Otro' ? '' : selectedItem.pieza || ''}
                                    placeholder="Escriba la pieza aqui"
                                    onChange={handleModalChangeCompatibilidad}
                                />
                            )}
                        </Form.Group>
                    </div>
                    <hr/>
                    <h6 className="mt-3 mb-2" >Compatible con:</h6>
                    <div className="d-flex justify-content-between">
                        <Form.Group className="mb-2 w-50 pe-2">
                            <Form.Label>Marca</Form.Label>
                            <Form.Select
                                name="adaptableMarca" 
                                value={selectAdaptableMarcaValue}
                                onChange={handleModalChangeCompatibilidad}
                            >
                                <option value="Seleccionar">Seleccionar</option>
                                {marcaOptions.map((marcaName, index) => (
                                    <option key={index} value={marcaName}>
                                        {marcaName}
                                    </option>
                                ))}
                                <option value="Otro">Otro </option>
                            </Form.Select>
                            {(selectAdaptableMarcaValue === 'Otro' || isCustomAdaptableMarca) && (
                                <Form.Control
                                    className="mt-2"
                                    type="text"
                                    name="adaptableMarca" 
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
                       itemType === 'noticia' ? handleSaveChangesNoticias :
                       itemType === 'compatibilidad' ? handleSaveChangesCompatibilidad :
                       '';
                       
    // Asignación dinámica del título del modal
    const modalTitle = itemType === 'usuario' ? 'Editar Usuario': 
                       itemType === 'estudio' ? 'Editar Material de Estudio' :
                       itemType === 'compatibilidad' ? 'Editar Registro de Compatibilidad' :
                       itemType === 'noticia' ? 'Editar Noticias' :
                       'Editar Registro';
    return (
        <>
            <NavBar/>
            <main className="bg-gradient2">
                <div className="admin-container">
                    <div className="header-admin">
                        <h1>Sistema de Gestión Administrador</h1>
                    </div>
                    <div className="dashboard-grid">
                        {/* SECCIÓN USUARIOS */}
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
                        
                        {/* SECCIÓN PIEZAS */}
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
                        
                        {/* SECCIÓN M.ESTUDIO */}
                        <DataCard
                            title="M. Estudio"
                            icon={IconoLibro}
                            data={estudios} 
                            searchQuery={searchQueryEstudios}
                            setSearchQuery={setSearchQueryEstudios}
                            collectionName="estudios"
                            handleEdit={handleEditEstudio} 
                            handleDelete={handleEliminarEstudio} 
                            link={'/gestionMaEstudio'}
                            linkNuevo={'/nuevoEstudio'} 
                            showNewButton={true}
                        />

                        {/* SECCIÓN NOTICIAS */}
                        <DataCard
                            title="Noticias"
                            icon={IconoGrabadora}
                            data={noticia} 
                            searchQuery={searchQueryNoticia}
                            setSearchQuery={setSearchQueryNoticia}
                            collectionName="noticiascel"
                            handleEdit={handleEditNoticia} 
                            handleDelete={handleEliminarNoticia} 
                            link={'/gestionNoticias'}
                            linkNuevo={'/nuevaNoticia'} 
                            showNewButton={true}
                        />

                        <div className="grid-full-width">
                            {/* SECCIÓN COMPATIBILIDAD */}
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
                    <Button variant="secondary" onClick={handleCloseModal} >
                        Cerrar
                    </Button>
                    <Button variant="primary" onClick={handleSave} >
                        Guardar Cambios
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default GestionAdminPage;