import Swal from 'sweetalert2';
import IconologoXiami from '../../assets/logos/logoxiami.png'; // Asegúrate de ajustar la ruta si es necesario

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
            text: `El modelo (${userActual.modelo}) no tiene registrado un código de compatibilidad para ${nombreCampoBD}.`
        });
        return;
    }

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
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <img src="${IconologoXiami}" width="48" height="48" style="border-radius:6px;" alt="Logo Modelo" />
            <div style="line-height:1;">
                <div style="font-weight:600">${userActual.nombre || ''}</div>
                <div style="font-size:0.95em;color:#111111">Modelo: <strong>${userActual.modelo || ''}</strong></div>
            </div>
        </div>
    `;

    Swal.fire({
        title: `Compatibilidad: ${nombreCampoBD}`,
        html: `
            ${headerHtml}
            <div style="font-size: 0.95em;">
                <p style="margin-bottom: 10px;">El código <strong>${codigoCompatibilidad}</strong> es compatible con:</p>
                <ul style="list-style: none; padding: 0; max-height: 260px; overflow-y: auto; border: 1px solid #eee; padding: 10px;">
                    ${listaModelosHTML}
                </ul>
            </div>
        `,
        icon: 'success',
        confirmButtonText: 'Cerrar',
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