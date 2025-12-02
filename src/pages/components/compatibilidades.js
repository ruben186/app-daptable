import Swal from 'sweetalert2';
import IconologoXiami from '../../assets/logos/logoxiami.png';
import IconologoSamsung from '../../assets/logos/logosamgsumg.png';
import IconologoHuawei from '../../assets/logos/logohuawei.png';
import IconologoMotorola from '../../assets/logos/logomotorola.png';
import IconologoOppo from '../../assets/logos/OPPOLogo.png';
import IconologoRealme from '../../assets/logos/Realme_logo.png';
import IconologoVivo from '../../assets/logos/VivoLogo.png';
import IconologoZte from '../../assets/logos/zteLogo.png';
const MARCA_LOGOS = {
    'xiaomi': IconologoXiami,
    'redmi': IconologoXiami, 
    'samsung': IconologoSamsung,
    'huawei': IconologoHuawei,
    'motorola': IconologoMotorola,
    'oppo': IconologoOppo,
    'realme': IconologoRealme,
    'vivo': IconologoVivo,
    'zte': IconologoZte,
};
export const getLogoUrlByMarca = (marca) => {
    // Normaliza la marca a minúsculas para la búsqueda
    const normalizedMarca = marca ? marca.toLowerCase() : '';
    return MARCA_LOGOS[normalizedMarca] || null; 
};
// Función auxiliar para normalizar nombres de piezas (extraída de BtnMasXiaomi)
export const normalizePieceName = (nombrePieza) => {
    if (!nombrePieza) return '';
    const normalized = nombrePieza.toString().toLowerCase().trim();
    
    // Mapeo de nombres posibles a nombres de BD (Asegúrate que estas son las claves de tu BD)
    if (normalized.includes('pantalla')) return 'PANTALLA';
    if (normalized.includes('bateria') || normalized.includes('batería')) return 'BATERIA';
    if (normalized.includes('flex') && normalized.includes('boton')) return 'FLEX DE BOTONES';
    if (normalized.includes('flex') && normalized.includes('carga')) return 'FLEX DE CARGA';
    if (normalized.includes('puerto') || normalized.includes('pin')) return 'PUERTO DE CARGA';
    if (normalized.includes('vidrio')) return 'VIDRIO TEMPLADO';
    if (normalized.includes('visor')) return 'VISOR';
    if (normalized.includes('auricular')) return 'AURICULAR';
    
    // Si no es una de las comunes, lo devuelve en mayúsculas
    return normalized.toUpperCase();
};

// Helper para obtener la info de la pieza dentro de un documento de `tablas` (extraída de BtnMasXiaomi)
export const getPiezaInfoFromModel = (modelEntry, nombrePiezaBD) => {
    if (!modelEntry || !Array.isArray(modelEntry.campos)) return null;
    return modelEntry.campos.find(c => 
        (c.campo || '').toString().toUpperCase() === (nombrePiezaBD || '').toString().toUpperCase()
    );
};

// Normalizador para comparar códigos de forma exacta (trim + lower)
const normalizeCode = (c) => (c === undefined || c === null) ? '' : String(c).trim().toLowerCase();

/**
 * Lógica principal para buscar y mostrar compatibilidades.
 * @param {string} tipoPieza - El nombre de la pieza (e.g., 'Pantalla').
 * @param {object} userActual - El objeto del modelo actualmente seleccionado (de la colección 'tablas').
 * @param {Array<object>} modelos - La lista completa de todos los modelos de la colección 'tablas'.
 * @param {function} [logActivityFn] - Opcional: Función para registrar la actividad del usuario.
 * @param {object} [userAuth] - Opcional: El objeto de autenticación del usuario.
 */
export const handleCompatibilityCheck = (tipoPieza, userActual, modelos, logActivityFn, userAuth) => {
    
    if (!userActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No hay un modelo seleccionado para verificar la compatibilidad.'
        });
        return;
    }

    const nombreCampoBD = normalizePieceName(tipoPieza);

    const piezaInfoActual = getPiezaInfoFromModel(userActual, nombreCampoBD);
    const codigoCompatibilidad = piezaInfoActual?.codigoCompatibilidad;

    if (!codigoCompatibilidad || normalizeCode(codigoCompatibilidad) === '') {
        Swal.fire({
            icon: 'info',
            title: 'Sin Información',
            text: `El modelo (${userActual.modelo}) no tiene registrado un código de compatibilidad para ${nombreCampoBD}.`,
            background: '#052b27ff', // Color de fondo personalizado
            color: '#ffdfdfff', // Color del texto personalizado
            confirmButtonColor: '#0b6860ff'
        });
        return;
    }
    const marcaLogoUrl = getLogoUrlByMarca(userActual.marca);
    // Buscar hermanos (modelos con el mismo código de compatibilidad)
    const normTarget = normalizeCode(codigoCompatibilidad);
    const modelosCompatibles = modelos.filter(u => {
        // Excluir el modelo actual de la lista mostrada (si es posible, aunque es opcional)
        // if (u.id === userActual.id) return false; 
        
        const infoPiezaUsuario = getPiezaInfoFromModel(u, nombreCampoBD);
        const codigo = infoPiezaUsuario?.codigoCompatibilidad;
        
        return normalizeCode(codigo) === normTarget;
    });

    // Generar lista HTML
    const listaModelosHTML = modelosCompatibles.length > 0 
        ? modelosCompatibles.map(m => `<li style="text-align: left; margin-bottom: 5px;">📱 ${m.nombre || ''} - <strong>${m.modelo || ''}</strong></li>`).join('')
        : '<li>No se encontraron otros modelos con este código.</li>';

    // Generar encabezado de la alerta
    const headerHtml = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px; background: #269689; padding: 10px; border-radius: 40px; ">
            <img src="${marcaLogoUrl}" height="48" style="border-radius:6px;" alt="Logo Modelo" />
            <div style="line-height:1;">
                <div style="font-weight:600">${userActual.nombre || ''}</div>
                <div style="font-size:0.95em;">Modelo: <strong>${userActual.modelo || ''}</strong></div>
            </div>
        </div>
    `;

    Swal.fire({
        title: `Compatibilidad: ${nombreCampoBD}`,
        html: `
            ${headerHtml}
            <div style="font-size: 0.95em;">
                <p style="margin-bottom: 10px;">El código <strong>${codigoCompatibilidad}</strong> es compatible con:</p>
                <ul style="list-style: none; padding: 0; max-height: 260px; overflow-y: auto; border: 1px solid #eee; padding: 10px; background: #269689; border-radius: 20px;">
                    ${listaModelosHTML}
                </ul>
            </div>
        `,
        icon: 'success',
        confirmButtonText: 'Cerrar',
        background: '#124945ff', // Color de fondo personalizado
        color: '#ffffffff', // Color del texto personalizado
        confirmButtonColor: 'rgba(197, 81, 35, 1)',
        width: 680
    });

    // Registro de actividad (si se provee la función)
    if (userAuth && userActual && logActivityFn) {
        logActivityFn(userAuth.uid, {
            Modelo: userActual.nombre || userActual.modelo || 'Desconocido',
            Marca: userActual.marca || 'Desconocido',
            Pieza: nombreCampoBD,
            Accion: "Consulta de Compatibilidad (Historial/Perfil)",
            CodigoBuscado: codigoCompatibilidad,
        });
    }
};