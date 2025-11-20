import { useState } from 'react';
import Swal from 'sweetalert2';
import { auth } from '../../firebase';
import { db } from '../../firebase';
import { doc, setDoc, addDoc, collection} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './sugerirPiezaPage.css';

function SugerirPiezaPage() {
    const navigate = useNavigate();
    const [piezaOpen, setPiezaOpen] = useState(false);
    const [marcaOpen, setMarcaOpen] = useState(false)
    const [adaptableMarcaOpen, setAdaptableMarcaOpen] = useState(false);
    const [formData, setFormData] = useState({
        nombreCelular: '',
        modelo: '',
        marca: '',
        pieza: '',
        adaptableMarca: '',
        adaptableModelo: '',
        comentarios: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Lógica de envío a Firebase u otra API aquí
        console.log('Datos del formulario:', formData);

        // Ejemplo básico de SweetAlert
        Swal.fire({
            icon: 'success',
            title: 'Pieza Registrada',
            text: 'Tu sugerencia ha sido enviada para revisión.',
            customClass: {
                popup: 'swal-custom', // Clase para estilizar SweetAlert con el tema oscuro/teal
                title: 'swal-title',
                content: 'swal-text',
                confirmButton: 'swal-confirm-button'
            }
        });
    };

    return (
        <div className="bg-gradient2">
            
            <button type="button" className="btn-outline-secondary" onClick={() => navigate(-1)}>
                &lt; Volver
            </button>
            
            {/* Contenedor principal de 2 columnas para el diseño de la captura */}
            <div className="pieza-registro-container">
                
                {/* Columna Izquierda (Formulario) */}
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

                    {/* Marca */}
                    <div className="mb-3">
                        <label className="form-label">Marca:</label>
                        <div className={`select-wrapper ${marcaOpen ? 'open' : ''}`}>
                            <select
                                className="form-control2"
                                name="marca"
                                value={formData.marca}
                                onChange={handleChange}
                                onBlur={() => setMarcaOpen(false)}
                                onClick={() => setMarcaOpen(prev => !prev)}
                            >
                                <option value="">Seleccionar</option>
                                {/* Opciones de marca aquí */}
                            </select>
                            <span className="chev" aria-hidden="true" />
                        </div>
                    </div>

                    {/* Pieza */}
                    <div className="mb-3">
                        <label className="form-label">Pieza:</label>
                        <div className={`select-wrapper ${piezaOpen ? 'open' : ''}`}>
                            <select
                                className="form-control2"
                                name="pieza"
                                value={formData.pieza}
                                onChange={handleChange}
                                onBlur={() => setPiezaOpen(false)}
                                onClick={() => setPiezaOpen(prev => !prev)}
                            >
                                <option value="">Seleccionar</option>
                        
                            </select>
                            <span className="chev" aria-hidden="true" />
                        </div>
                    </div>

                    <label className="form-label">Adaptable con:</label>
                    <div className="" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                        <div  className={`select-wrapper ${adaptableMarcaOpen ? 'open' : ''}`}>
                            <select
                                className="form-control2"
                                name="adaptableMarca"
                                value={formData.adaptableMarca}
                                onChange={handleChange}
                                onBlur={() => setAdaptableMarcaOpen(false)}
                                onClick={() => setAdaptableMarcaOpen(prev => !prev)}
                            >
                                <option value="">Marca</option>
                            </select>
                            <span className="chev" aria-hidden="true" />
                        </div>
                        
                        <input 
                            type="text" 
                            className="form-control2" 
                            name="adaptableModelo" 
                            value={formData.adaptableModelo} 
                            onChange={handleChange} 
                            placeholder="Modelo o nombre" 
                            style={{flex: 2}}
                        />
                    </div>
                   

                </form>
                
                <div className="col-imagen-comentarios">
                    <label className="form-label">Añade una imagen:</label>
                    <div className="caja-imagen-placeholder">
                        <span className="icono-mas">+</span>
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
                        <button type="submit" className="btn-primary">Registrar</button>
                    </div>
        </div>
    );
}

export default SugerirPiezaPage;