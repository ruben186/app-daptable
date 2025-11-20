

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useNavigate,Link } from 'react-router-dom';
import { Container,Nav, Table, Button, Form, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { auth, db } from '../../firebase';
import './xiaomi.css';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import logoxiami from '../../assets/logos/logoxiami.png'; 

// Importación de Iconos e Imágenes
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
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
    const [showModal, setShowModal] = useState(false); // Se mantiene por si reactivas la edición
    const [selectedAux, setSelectedAux] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Carga inicial de datos (Solo Marcas Xiaomi/Redmi)
    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'tablas'));
                const data = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(user => {
                        // Filtro básico por Marca para mostrar solo lo relevante en esta vista
                        const marca = user.marca?.toLowerCase();
                        return marca === 'redmi' || marca === 'xiaomi';
                    });

                setUsuarios(data);
                setUsuariosFiltrados(data);
            } catch (error) {
                console.error("Error cargando datos:", error);
            }
        };
        fetchUsuarios();
    }, []);

    // 2. Lógica de Búsqueda Profunda (Nombre, Modelo Y Código de Compatibilidad)
    useEffect(() => {
        const term = searchTerm.toLowerCase();
        
        const results = usuarios.filter(user => {
            // Buscamos coincidencia en Nombre o Modelo
            const porNombre = user.nombre?.toLowerCase().includes(term);
            const porModelo = user.modelo?.toLowerCase().includes(term);

            // Buscamos coincidencia dentro del array 'campos' (por codigoCompatibilidad)
            // user.campos puede ser undefined, usamos ?. y validamos que sea array
            const porCompatibilidad = Array.isArray(user.campos) && user.campos.some(item => 
                item.codigoCompatibilidad?.toLowerCase().includes(term)
            );

            return porNombre || porModelo || porCompatibilidad;
        });

        setUsuariosFiltrados(results);
    }, [searchTerm, usuarios]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // 3. Función Auxiliar para obtener datos del Array 'campos'
    // Busca el objeto dentro del array que corresponda a la pieza (ej: "PANTALLA")
    // Esta función auxiliar la seguimos usando para encontrar la pieza dentro del array
    const getPiezaInfo = (user, nombrePiezaBD) => {
        if (!user.campos || !Array.isArray(user.campos)) return null;
        // Busca ignorando mayúsculas/minúsculas
        return user.campos.find(c => c.campo?.toUpperCase() === nombrePiezaBD.toUpperCase());
    };

    // 4. Lógica para decidir qué Icono mostrar (Verde o Rojo)
    const getIconoDinamico = (user, tipoPieza) => {
        let piezaInfo = null;
        let iconoVerde, iconoRojo;

        // Mapeamos el tipo de pieza a los nombres que usas en BD y asignamos iconos
        switch(tipoPieza) {
            case 'pantalla':
                piezaInfo = getPiezaInfo(user, 'PANTALLA');
                iconoVerde = IconoPantallaV;
                iconoRojo = IconoPantallaR;
                break;
            case 'bateria':
                piezaInfo = getPiezaInfo(user, 'BATERIA'); // Asegúrate que en BD se llame 'BATERIA'
                iconoVerde = IconoBateriaV;
                iconoRojo = IconoBateriaR;
                break;
            case 'flexBotones':
                // Aquí busca si contiene la palabra FLEX o es exactamente FLEX BOTONES, ajusta según tu BD
                piezaInfo = getPiezaInfo(user, 'FLEX BOTONES') || getPiezaInfo(user, 'FLEX DE BOTONES');
                iconoVerde = IconoFlexBotonesV;
                iconoRojo = IconoFlexBotonesR;
                break;
            default:
                
        }

        // Verificamos si existe info y si el código de compatibilidad no está vacío
        const tieneDatos = piezaInfo && piezaInfo.codigoCompatibilidad && piezaInfo.codigoCompatibilidad.trim() !== '';

        return tieneDatos ? iconoVerde : iconoRojo;
    };

   const handleIconClick = (tipoPieza, userActual) => {
        // 1. Definir qué pieza estamos buscando (Pantalla, Batería, etc.)
        let nombreCampoBD = '';
        if (tipoPieza === 'pantalla') nombreCampoBD = 'PANTALLA';
        else if (tipoPieza === 'bateria') nombreCampoBD = 'BATERIA';
        else if (tipoPieza === 'flexBotones') nombreCampoBD = 'FLEX BOTONES'; // Ojo con el nombre exacto en tu BD

        // 2. Obtener el código del celular actual al que le diste clic
        const piezaInfoActual = getPiezaInfo(userActual, nombreCampoBD);
        const codigoCompatibilidad = piezaInfoActual?.codigoCompatibilidad;

        // Si no hay código, mostramos error y salimos
        if (!codigoCompatibilidad || codigoCompatibilidad.trim() === '') {
            Swal.fire({
                icon: 'error',
                title: 'Sin Información',
                text: `Este modelo (${userActual.modelo}) no tiene registrado un código de compatibilidad para ${nombreCampoBD}.`
            });
            return;
        }

        // 3. BUSCAR HERMANOS: Filtrar todos los usuarios para ver quiénes comparten ese código
        const modelosCompatibles = usuarios.filter(u => {
            const infoPiezaUsuario = getPiezaInfo(u, nombreCampoBD);
            // Compara si el código es igual al del usuario actual (y que no sea nulo)
            return infoPiezaUsuario?.codigoCompatibilidad === codigoCompatibilidad;
        });

        // 4. Generar la lista HTML para mostrar en la Alerta
        // Usamos .map para crear una lista de items <li>
        const listaModelosHTML = modelosCompatibles.length > 0 
            ? modelosCompatibles.map(m => `<li style="text-align: left; margin-bottom: 5px;">📱 ${m.nombre} - <strong>${m.modelo}</strong></li>`).join('')
            : '<li>No se encontraron otros modelos.</li>';

        // 5. Mostrar la Alerta con la lista
        Swal.fire({
            title: `Compatibilidad: ${nombreCampoBD}`,
            html: `
                <div style="font-size: 1em;">
                    <p style="margin-bottom: 10px;">El código <strong>${codigoCompatibilidad}</strong> es compatible con:</p>
                    <ul style="list-style: none; padding: 0; max-height: 200px; overflow-y: auto; border: 1px solid #eee; padding: 10px;">
                        ${listaModelosHTML}
                    </ul>
                </div>
            `,
            icon: 'success',
            confirmButtonText: 'Genial'
        });
    };

    return (
        <>
            <NavBar />
            <main className="main-content-dashboard bg-gradient2">
                <Container className="mt-5 ">
                    <div className="table-container">
                        <div className="header-tabla"></div>
                        <div className='header-tabla2'>
                            <div className="nombre-tabla">
                                <img src={IconologoXiami} className='mover-logo-xiaomi' width="54px" height="54px" alt="Logo Xiaomi" />
                                <h5 className='texto-separado'>
                                    Si un icono es <span style={{ color: 'red' }}>rojo</span> quiere decir que no hay información de Compatibilidad.
                                </h5>
                            </div>

                            <InputGroup className="search-input-group" style={{ maxWidth: '300px' }}>
                                <Form.Control
                                    type="text"
                                    placeholder="Buscar por nombre, modelo o código..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="search-buscar"
                                />
                                <img
                                    width="28px"
                                    height="28px"
                                    src={IconoBuscar}
                                    className='btn-icon-buscar'
                                    alt="Icono buscar"
                                />
                            </InputGroup>
                        </div>

                        <Table striped bordered hover responsive className="tabla-auxiliares">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
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

                                        {/* Columna Pantalla Dinámica */}
                                        <td style={{ textAlign: 'center' }}>
                                            <Button variant="link" onClick={() => handleIconClick('pantalla', aux)} className="p-0 border-0 icon-hover-effect">
                                                <img
                                                    src={getIconoDinamico(aux, 'pantalla')}
                                                    width="22px"
                                                    height="34px"
                                                    alt="Estado Pantalla"
                                                    className="icon-hover-lift"
                                                />
                                            </Button>
                                        </td>

                                        {/* Columna Bateria Dinámica */}
                                        <td style={{ textAlign: 'center' }}>
                                            <Button variant="link" onClick={() => handleIconClick('bateria', aux)} className="p-0 border-0 icon-hover-effect">
                                                <img
                                                    src={getIconoDinamico(aux, 'bateria')}
                                                    width="24px"
                                                    height="34px"
                                                    alt="Estado Bateria"
                                                    className="icon-hover-lift"
                                                />
                                            </Button>
                                        </td>

                                        {/* Columna Flex Botones Dinámica */}
                                        <td style={{ textAlign: 'center' }}>
                                            <Button variant="link" onClick={() => handleIconClick('flexBotones', aux)} className="p-0 border-0 icon-hover-effect">
                                                <img
                                                    src={getIconoDinamico(aux, 'flexBotones')}
                                                    width="34px"
                                                    height="34px"
                                                    alt="Estado Flex"
                                                    className="icon-hover-lift"
                                                  
                                                />
                                            </Button>
                                        </td>

                                        {/* Columna Más */}
                                      <td style={{ textAlign: 'center' }}>
                                          <Button variant="link"  onClick={() => { navigate('/BtnMasXiaomi'); }}
                                         className="p-0 border-0 icon-hover-effect"
                                        >
                                            <img 
                                                src={IconoPiezaA} 
                                                width="34px" 
                                                height="34px" 
                                                alt="Más detalles" 
                                                className="icon-hover-lift" 
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