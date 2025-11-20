import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { auth, db } from '../../firebase';
import { addDoc, collection, getDocs } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import './sugerirPiezaPage.css';

function SugerirPiezaPage() {
    const navigate = useNavigate();

    // 1. ESTADOS DE CONTROL PARA DESPLEGABLES (CLASE 'open')
    const [piezaOpen, setPiezaOpen] = useState(false); 
    const [marcaOpen, setMarcaOpen] = useState(false);
    const [adaptableMarcaOpen, setAdaptableMarcaOpen] = useState(false);

    // 2. ESTADOS DINÁMICOS OBTENIDOS DE FIREBASE
    const [marcasDisponibles, setMarcasDisponibles] = useState(['Otro']);
    const [piezasDisponibles, setPiezasDisponibles] = useState(['Otro']);

    // 3. ESTADOS PARA LA LÓGICA DE DESPLIEGUE "OTRO"
   
    const [mostrarInputNuevaMarca, setMostrarInputNuevaMarca] = useState(false);
    const [nuevaMarcaInput, setNuevaMarcaInput] = useState('');
   
    const [mostrarInputNuevaPieza, setMostrarInputNuevaPieza] = useState(false);
    const [nuevaPiezaInput, setNuevaPiezaInput] = useState('');
   
    const [mostrarInputNuevaAdaptableMarca, setMostrarInputNuevaAdaptableMarca] = useState(false);
    const [nuevaAdaptableMarcaInput, setNuevaAdaptableMarcaInput] = useState('');

    const [imagenFile, setImagenFile] = useState(null);
    const [imagenPreview, setImagenPreview] = useState(null);

    const [formData, setFormData] = useState({
        nombreCelular: '',
        modelo: '',
        marca: '', 
        pieza: '', 
        adaptableMarca: '', 
        adaptableModelo: '',
        comentarios: '',
    });

    // LÓGICA DE CARGA DE MARCAS Y PIEZAS DESDE FIREBASE
    useEffect(() => {
        const fetchMarcasYPiezas = async () => {
            try {
                const coleccionRef = collection(db, 'tablas'); 
                const snapshot = await getDocs(coleccionRef);
                
                const marcasSet = new Set();
                const piezasSet = new Set();
                
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    
                    if (data.marca && typeof data.marca === 'string') {
                        marcasSet.add(data.marca.trim()); 
                    }

                    if (Array.isArray(data.campos)) {
                        data.campos.forEach(campo => {
                            if (campo.campo && typeof campo.campo === 'string') {
                                piezasSet.add(campo.campo.trim());
                            }
                        });
                    }
                });
                
                // Aseguramos que la opción "Otro" esté al final
                setMarcasDisponibles([...Array.from(marcasSet), 'Otro']);
                setPiezasDisponibles([...Array.from(piezasSet), 'Otro']);
            } catch (error) {
                console.error("Error al cargar datos:", error);
                setMarcasDisponibles(['Error de carga', 'Otro']);
                setPiezasDisponibles(['Error de carga', 'Otro']);
            }
        };
        fetchMarcasYPiezas();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        
        // Revocar la URL anterior si existe
        if (imagenPreview) {
            URL.revokeObjectURL(imagenPreview);
        }

        if (file) {
            setImagenFile(file);
            setImagenPreview(URL.createObjectURL(file));
        } else {
            setImagenFile(null);
            setImagenPreview(null);
        }
    };

    // HANDLERS PARA MARCA, PIEZA Y MARCA ADAPTABLE 
    const handleSelectMarca = (e) => {
        const nuevaSeleccion = e.target.value;
        setMarcaOpen(false); // Cierra el wrapper visual

        if (nuevaSeleccion === 'Otro') {
            setMostrarInputNuevaMarca(true);
            setFormData(prev => ({ ...prev, marca: 'Otro' })); 
            setNuevaMarcaInput('');
        } else {
            setMostrarInputNuevaMarca(false);
            setNuevaMarcaInput('');
            setFormData(prev => ({ ...prev, marca: nuevaSeleccion }));
        }
    };
    
    const handleInputNuevaMarcaChange = (e) => {
        const nuevoValor = e.target.value;
        setNuevaMarcaInput(nuevoValor);
        setFormData(prev => ({ ...prev, marca: nuevoValor })); 
    };

    const handleSelectPieza = (e) => {
        const nuevaSeleccion = e.target.value;
        setPiezaOpen(false); 

        if (nuevaSeleccion === 'Otro') {
            setMostrarInputNuevaPieza(true);
            setFormData(prev => ({ ...prev, pieza: 'Otro' })); 
            setNuevaPiezaInput('');
        } else {
            setMostrarInputNuevaPieza(false);
            setNuevaPiezaInput('');
            setFormData(prev => ({ ...prev, pieza: nuevaSeleccion }));
        }
    };

    const handleInputNuevaPiezaChange = (e) => {
        const nuevoValor = e.target.value;
        setNuevaPiezaInput(nuevoValor);
        setFormData(prev => ({ ...prev, pieza: nuevoValor })); 
    };
    
    // HANDLER PARA EL SELECT DE MARCA ADAPTABLE 
    const handleSelectAdaptableMarca = (e) => {
        const nuevaSeleccion = e.target.value;
        setAdaptableMarcaOpen(false); 

        if (nuevaSeleccion === 'Otro') {
            setMostrarInputNuevaAdaptableMarca(true); 
            setFormData(prev => ({ ...prev, adaptableMarca: 'Otro' })); 
            setNuevaAdaptableMarcaInput('');
        } else {
            setMostrarInputNuevaAdaptableMarca(false); 
            setNuevaAdaptableMarcaInput('');
            setFormData(prev => ({ ...prev, adaptableMarca: nuevaSeleccion }));
        }
    };
    
    // HANDLER PARA EL INPUT DE TEXTO DE LA NUEVA MARCA ADAPTABLE (NUEVO)
    const handleInputNuevaAdaptableMarcaChange = (e) => {
        const nuevoValor = e.target.value;
        setNuevaAdaptableMarcaInput(nuevoValor);
        setFormData(prev => ({ ...prev, adaptableMarca: nuevoValor }));
    };


    // Handler general para otros campos (Modelo, Comentarios, etc.)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    // HANDLER DE SUBMIT CON VALIDACIÓN ACTUALIZADA
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Determinar los valores finales para la validación
        const marcaFinal = formData.marca === 'Otro' ? nuevaMarcaInput.trim() : formData.marca;
        const piezaFinal = formData.pieza === 'Otro' ? nuevaPiezaInput.trim() : formData.pieza;
        const adaptableMarcaFinal = formData.adaptableMarca === 'Otro' ? nuevaAdaptableMarcaInput.trim() : formData.adaptableMarca;

        const dataToValidate = {
            ...formData,
            marca: marcaFinal,
            pieza: piezaFinal,
            adaptableMarca: adaptableMarcaFinal,
        };

        const requiredFields = ['nombreCelular', 'marca', 'pieza', 'adaptableMarca', 'adaptableModelo'];
        let missingFields = [];

        // 1. Verificar campos vacíos
        requiredFields.forEach(field => {
            if (!dataToValidate[field]) {
                missingFields.push(field);
            }
        });

        if (missingFields.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos Incompletos',
                text: `Por favor, llenar todos los campos necesarios`,
                background: '#052b27ff', 
                color: '#ffdfdfff', 
                confirmButtonColor: '#0b6860ff',
            });
            return;
        }

        // 2. Verificar usuario autenticado
        const user = auth.currentUser;
        if (!user) {
            Swal.fire({
                icon: 'error',
                title: 'Error de Autenticación',
                text: 'Debes iniciar sesión para enviar una sugerencia.',
                background: '#052b27ff', 
                color: '#ffdfdfff', 
                confirmButtonColor: '#0b6860ff',
            });
            return;
        }
        let urlImagen = '';
        try {
            // 3. Preparar y enviar los datos a Firestore
            const suggestionData = {
                ...formData,
                marca: marcaFinal, 
                pieza: piezaFinal,
                adaptableMarca: adaptableMarcaFinal, 
                urlImagen: urlImagen,
                userId: user.uid,
                fechaSugerencia: new Date(),
                estado: 'pendiente'
            };
            
            await addDoc(collection(db, 'sugerenciasPiezas'), suggestionData);
            
            // 4. Mostrar SweetAlert de éxito y limpiar
            Swal.fire({
                icon: 'success',
                title: 'Pieza Sugerida',
                text: 'Tu sugerencia ha sido enviada con éxito para revisión.',
                background: '#052b27ff', 
                color: '#ffffffff', 
                confirmButtonColor: '#0b6860ff',
            }).then(() => {
                // Limpiar el formulario y estados
                setFormData({
                    nombreCelular: '', modelo: '', marca: '', pieza: '', adaptableMarca: '', adaptableModelo: '', comentarios: '',
                });
                setMostrarInputNuevaMarca(false);
                setNuevaMarcaInput('');
                setMostrarInputNuevaPieza(false);
                setNuevaPiezaInput('');
                setMostrarInputNuevaAdaptableMarca(false);
                setNuevaAdaptableMarcaInput(''); 

                if (imagenPreview) {
                    URL.revokeObjectURL(imagenPreview);
                }
                setImagenFile(null);
                setImagenPreview(null);
            });

        } catch (error) {
            // 5. Manejo de errores de Firebase
            console.error('Error al registrar la sugerencia en Firebase:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de Registro',
                text: `No se pudo enviar la sugerencia. Detalle: ${error.message}`,
                customClass: { popup: 'swal-custom', title: 'swal-title', content: 'swal-text', confirmButton: 'swal-confirm-button' }
            });
        }
    };

    return (
        <div className="bg-gradient2">
            
            <button type="button" className="btn-outline-secondary" onClick={() => navigate(-1)}>
                &lt; Volver
            </button>
            
            <div className="pieza-registro-container">
                
                <form onSubmit={handleSubmit} className="col-formulario">
                    
                    <h3 className="mb-4" style={{textAlign: 'center'}}>Sugerir Pieza</h3>
                
                    {/* Nombre del celular */}
                    <div className="mb-3">
                        <label className="form-label">Nombre del celular:</label>
                        <input 
                            type="text" 
                            className="form-control2" 
                            name="nombreCelular" 
                            value={formData.nombreCelular} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    {/* Modelo (Opcional) */}
                    <div className="mb-3">
                        <label className="form-label">Modelo:</label>
                        <input 
                            type="text" 
                            className="form-control2" 
                            name="modelo" 
                            value={formData.modelo} 
                            onChange={handleChange}
                            placeholder="(Opcional)" 
                        />
                    </div>

                    {/* Marca INPUT DESPLEGABLE*/}
                    <div className="mb-3">
                        <label className="form-label">Marca:</label>
                        <div className={`select-wrapper ${marcaOpen ? 'open' : ''}`}>
                            <select
                                className="form-control2"
                                name="marca"
                                value={formData.marca}
                                onChange={handleSelectMarca} 
                                onBlur={() => setMarcaOpen(false)}
                                onClick={() => setMarcaOpen(prev => !prev)}
                                required
                            >
                                <option value="">Seleccionar</option>
                                {marcasDisponibles.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <span className="chev" aria-hidden="true" />
                        </div>
                        {/* INPUT DESPLEGABLE PARA NUEVA MARCA */}
                        {mostrarInputNuevaMarca && (
                            <div className="mb-3 input-desplegado">
                                <input
                                    type="text"
                                    className="form-control2 despliegue-otro"
                                    value={nuevaMarcaInput}
                                    onChange={handleInputNuevaMarcaChange}
                                    placeholder="Escribe la marca aquí"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Pieza (DINÁMICO CON INPUT DESPLEGABLE) */}
                    <div className="mb-3">
                        <label className="form-label">Pieza:</label>
                        <div className={`select-wrapper ${piezaOpen ? 'open' : ''}`}>
                            <select
                                className="form-control2"
                                name="pieza"
                                value={formData.pieza}
                                onChange={handleSelectPieza} 
                                onBlur={() => setPiezaOpen(false)}
                                onClick={() => setPiezaOpen(prev => !prev)}
                                required
                            >
                                <option value="">Seleccionar</option>
                                {piezasDisponibles.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                            <span className="chev" aria-hidden="true" />
                        </div>
                        {/* INPUT DESPLEGABLE PARA  PIEZA */}
                        {mostrarInputNuevaPieza && (
                            <div className="mb-3 input-desplegado">
                                <input
                                    type="text"
                                    className="form-control2 despliegue-otro "
                                    value={nuevaPiezaInput}
                                    onChange={handleInputNuevaPiezaChange}
                                    placeholder="Escribe la pieza aquí"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Adaptabilidad (SECCIÓN CON INPUT DESPLEGABLE DEBAJO DEL SELECT) */}
                    <label className="form-label">Adaptable con:</label>
                    <div className="" style={{display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
                        
                        {/* CONTENEDOR FLEXIBLE PARA LA MARCA Y SU INPUT DESPLEGABLE */}
                        <div style={{flex: 1, position: 'relative'}}>
                            
                            {/* SELECT ORIGINAL DE MARCA ADAPTABLE */}
                            <div className={`select-wrapper2 ${adaptableMarcaOpen ? 'open' : ''}`}>
                                <select
                                    className="adaptableMarca"
                                    name="adaptableMarca"
                                    value={formData.adaptableMarca}
                                    onChange={handleSelectAdaptableMarca} 
                                    onBlur={() => setAdaptableMarcaOpen(false)}
                                    onClick={() => setAdaptableMarcaOpen(prev => !prev)}
                                    required
                                >
                                    <option value="">Seleccionar marca</option>
                                    {marcasDisponibles.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}

                                </select>
                                <span className="chev" aria-hidden="true" />
                            </div>
                            
                            {/* INPUT DESPLEGABLE PARA NUEVA MARCA ADAPTABLE */}
                            {mostrarInputNuevaAdaptableMarca && (
                                <div style={{ 
                                    position: 'absolute', 
                                    top: 'calc(100% + 5px)', 
                                    left: 0, 
                                    width: '100%', 
                                    zIndex: 2,
                                    marginTop: '5px' 
                                }}>
                                    <input
                                        type="text"
                                        className="form-control2"
                                        value={nuevaAdaptableMarcaInput}
                                        onChange={handleInputNuevaAdaptableMarcaChange} 
                                        placeholder="Escribe la marca"
                                        required
                                    />
                                </div>
                            )}
                        </div>
                        
                        {/* Campo de Modelo*/}
                        <input 
                            type="text" 
                            className="form-control2" 
                            name="adaptableModelo" 
                            value={formData.adaptableModelo} 
                            onChange={handleChange} 
                            required
                            placeholder="Modelo o nombre" 
                            style={{flex: 1}}
                        />
                    </div>
                    
                </form>
                
                <div className="col-imagen-comentarios">
                    <label className="form-label">Añade una imagen (opcional):</label>
                    {/* CAJA DE IMAGEN CON PREVIEW Y INPUT DE ARCHIVO */}
                    <div className="caja-imagen-placeholder" onClick={() => document.getElementById('file-input').click()}>
                        
                        {imagenPreview ? (
                            <img 
                                src={imagenPreview} 
                                alt="Vista previa de la imagen" 
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover' 
                                }}
                            />
                        ) : (
                            <span className="icono-mas">+</span>
                        )}

                        {/* INPUT DE ARCHIVO OCULTO */}
                        <input
                            type="file"
                            id="file-input"
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                    <textarea
                        className="form-control2 textarea-comentarios"
                        name="comentarios"
                        value={formData.comentarios}
                        placeholder='¿Deseas escribir algo más?(Opcional)'
                        onChange={handleChange}
                    ></textarea>
                </div>
                
            </div>
            
            <div className="d-grid gap-2" style={{marginTop: '30px'}}>
                <button type="submit" className="btn-primary" onClick={handleSubmit}>Enviar Sugerencia</button>
            </div>
        </div>
    );
}

export default SugerirPiezaPage;