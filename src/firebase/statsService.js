import { db } from '../firebase';
import { collectionGroup, query, orderBy, limit, getDocs } from 'firebase/firestore';
/**
 * Obtiene el numero de piezas más vistas globalmente de todos los historiales de los usuarios.
 * @param {number} topN - El número de resultados a devolver.
 * @returns {Array} Una lista de los documentos de historial más vistos.
 */

export const fetchTopVistasGlobal = async (topN = 5) => {
    try {
        // La consulta de grupo busca en todas las subcolecciones con el nombre 'historial_consultas'
        const consultasRef = collectionGroup(db, 'historial_consultas');
        // 1. Ordenar por el campo 'vistas' en orden descendente (más vistas primero)
        // 2. Limitar al número solicitado (topN)
        const q = query(
            consultasRef, 
            orderBy('vistas', 'desc'), 
            limit(topN)
        );

        const snapshot = await getDocs(q);
        const topPiezas = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return topPiezas;

    } catch (error) {
        console.error("Error al obtener el Top Vistas global:", error);
        return [];
    }
};