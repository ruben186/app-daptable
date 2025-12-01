import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Table, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { db, auth } from '../../firebase';
import './xiaomi.css';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import { logActivity } from '../../firebase/historialService';
import { handleCompatibilityCheck, getPiezaInfoFromModel } from '../components/compatibilidades';
import { useAuthState } from 'react-firebase-hooks/auth';

// Importación de Iconos e Imágenes
import IconoPantallaV from '../../assets/Iconos/iconoPantallaVerde.png';
import IconoPantallaR from '../../assets/Iconos/iconoPantallaRojo.png';
import IconoBateriaR from '../../assets/Iconos/IconoBateriaR3.png';
import IconoBateriaV from '../../assets/Iconos/IconoBateriaV.png';
import IconoFlexBotonesV from '../../assets/Iconos/flexBotonesV.png';
import IconoFlexBotonesR from '../../assets/Iconos/flexBotonesR.png';
import IconoPiezaA from '../../assets/Iconos/IconoPiezaA.png';

// Importación de Iconos logos de marcas en verde
import IconologoXiamiV from '../../assets/logos/logoxiaomiverde2.png';
import IconologoSamsungV from '../../assets/logos/logosamsumgV.png';
import IconologoHuaweiV from '../../assets/logos/logohuaweiV.png';
import IconologoMotorolaV from '../../assets/logos/logomotorolaV.png';
import IconologoOppoV from '../../assets/logos/logooppoV.png';

//  Importación de Iconos logos de marcas 
import IconologoXiami from '../../assets/logos/logoxiami.png';
import IconologoSamsung from '../../assets/logos/logosamgsumg.png';
import IconologoHuawei from '../../assets/logos/logohuawei.png';
import IconologoMotorola from '../../assets/logos/logomotorola.png';
import IconologoOppo from '../../assets/logos/OPPOLogo.png';
import IconologoRealme from '../../assets/logos/Realme_logo.png';
import IconologoVivo from '../../assets/logos/VivoLogo.png';
import IconologoZte from '../../assets/logos/zteLogo.png';




function Xiaomi() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const brandParam = params.get('brand')?.toLowerCase();
    const [usuarios, setUsuarios] = useState([]);
    const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [user] = useAuthState(auth);

    // 1. Carga inicial de datos (Solo Marcas Xiaomi/Redmi)
    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'tablas'));
                const data = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                setUsuarios(data);
                setUsuariosFiltrados(data);
            } catch (error) {
                console.error("Error cargando datos:", error);
            }
        };
        fetchUsuarios();
    }, []);

    // 2. Filtrado combinado: por marca (query param) y por término de búsqueda
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const brandParam = params.get('brand')?.toLowerCase();
        const qParam = params.get('q') || '';

        // Si la URL contiene 'q' la usamos como fuente de verdad; si no, limpiamos el estado de búsqueda
        const hasQ = new URLSearchParams(location.search).has('q');
        if (hasQ) {
            if (qParam !== searchTerm) setSearchTerm(qParam);
        } else {
            if (searchTerm !== '') setSearchTerm('');
        }

        const term = (hasQ ? qParam : '').toLowerCase();

        let results = usuarios.slice();

        // Aliases para marcas (ajusta si tu BD usa nombres diferentes)
        const brandAliases = {
            samsung: ['samsung', 'samgsumg'],
            xiaomi: ['xiaomi', 'redmi'],
            motorola: ['motorola', 'moto'],
            huawei: ['huawei'],
            oppo: ['oppo'],
            realme: ['realme'],
            vivo: ['vivo'],
            zte: ['zte']
        };

        if (brandParam) {
            const aliases = brandAliases[brandParam] || [brandParam];
            results = results.filter(u => {
                const m = (u.marca || '').toLowerCase();
                return aliases.some(a => (m && (m === a || m.includes(a) || a.includes(m))));
            });
        } else {
            // Comportamiento por defecto: mostrar solo Xiaomi/Redmi en esta vista
            results = results.filter(u => {
                const m = (u.marca || '').toLowerCase();
                return m === 'redmi' || m === 'xiaomi';
            });
        }

        // Aplicar búsqueda (nombre/modelo/código) sobre el conjunto ya filtrado por marca
        if (term) {
            results = results.filter(user => {
                const porNombre = user.nombre?.toLowerCase().includes(term);
                const porModelo = user.modelo?.toLowerCase().includes(term);
                const porCompatibilidad = Array.isArray(user.campos) && user.campos.some(item => 
                    item.codigoCompatibilidad?.toLowerCase().includes(term)
                );
                return porNombre || porModelo || porCompatibilidad;
            });
        }

        setUsuariosFiltrados(results);
    }, [usuarios, location.search, searchTerm]);

    // Logo dinámico según brand
    const getLogoForBrand = () => {
        const params = new URLSearchParams(location.search);
        const brandParam = params.get('brand')?.toLowerCase();
        switch (brandParam) {
            case 'samsung': return IconologoSamsungV;
            case 'huawei': return IconologoHuaweiV;
            case 'motorola': return IconologoMotorolaV;
            case 'oppo': return IconologoOppoV;
            case 'realme': return IconologoRealme;
            case 'vivo': return IconologoVivo;
            case 'zte': return IconologoZte ;
            case 'xiaomi':return IconologoXiamiV;
            default:
                return;
        }
    };


    
    // Nota: la búsqueda desde el navbar actualiza la URL y `searchTerm` se sincroniza desde allí.

    // 3. Función Auxiliar para obtener datos del Array 'campos'
    // Busca el objeto dentro del array que corresponda a la pieza (ej: "PANTALLA")
    // Esta función auxiliar la seguimos usando para encontrar la pieza dentro del array
    const getPiezaInfo = (user, nombrePiezaBD) => {
        return getPiezaInfoFromModel(user, nombrePiezaBD);
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
                return null;
                
        }

        // Verificamos si existe info y si el código de compatibilidad no está vacío
        const tieneDatos = piezaInfo && piezaInfo.codigoCompatibilidad && piezaInfo.codigoCompatibilidad.trim() !== '';

        return tieneDatos ? iconoVerde : iconoRojo;
    };

    const handleIconClick = async (tipoPieza, userActual) => {
        // 1. Definir qué pieza estamos buscando (Pantalla, Batería, etc.)
        await handleCompatibilityCheck(
        tipoPieza, 
        userActual, 
        usuarios, // La lista completa de modelos cargada en el estado 'usuarios'
        logActivity, // La función importada para el historial
        user // El objeto de autenticación del usuario
        );
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
                                <img src={getLogoForBrand()} className='mover-logo-xiaomi' width="54px" height="54px" alt="Logo Marca" />
                                <h5 className='texto-separado'>
                                    Si un icono es <span style={{ color: 'red' }}>rojo</span> quiere decir que no hay información de Compatibilidad.
                                </h5>
                            </div>

                            {/* <InputGroup className="search-input-group" style={{ maxWidth: '300px' }}>
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
                            </InputGroup> */}
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
                                          <Button
                                              variant="link"
                                              onClick={() => { navigate('/BtnMasXiaomi', { state: { nombre: aux.nombre, modelo: aux.modelo, brand: brandParam } }); }}
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