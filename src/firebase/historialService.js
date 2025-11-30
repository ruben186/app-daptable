import { db } from '../firebase'; // Asegúrate que esta ruta es correcta
import { doc,setDoc, addDoc, Timestamp } from 'firebase/firestore';


/**
 * Genera un ID determinista (siempre el mismo) a partir de los datos clave.
 * Esto asegura que dos consultas idénticas (Marca-Modelo-Pieza) usen el mismo ID de documento.
 * @param {string} marca 
 * @param {string} modelo 
 * @param {string} pieza 
 * @returns {string} ID seguro para Firestore.
 */
const createHistorialId = (marca, modelo, pieza) => {
    // Normalizar a mayúsculas y concatenar las claves
    const key = `${(marca || '').toUpperCase()}-${(modelo || '').toUpperCase()}-${(pieza || '').toUpperCase()}`;
    
    // Codificación para asegurar que el ID sea válido y no contenga caracteres especiales
    try {
        // btoa (Base64) + reemplazo de caracteres inseguros
        return btoa(key).replace(/\//g, '_').replace(/\+/g, '-');
    } catch (e) {
        console.error("Error al codificar ID, usando string plano:", e);
        // Fallback: usar el string y quitar caracteres no permitidos
        return key.replace(/[^a-zA-Z0-9_-]/g, ''); 
    }
};
export const logActivity = async (userId, data) => {
    if (!userId) {
        console.error("Error: UID de usuario no proporcionado para registrar actividad.");
        return;
    }

    // Validación crítica: Necesitamos los campos clave para generar un ID único.
    if (!data.Marca || !data.Modelo || !data.Pieza) {
        console.error("Error: Datos incompletos para generar ID de historial. Se requiere Marca, Modelo y Pieza.");
        return;
    }

    // 1. Crear el ID de documento único
    const docId = createHistorialId(data.Marca, data.Modelo, data.Pieza);

    try {
        // 2. Definir la referencia al documento específico (usando el ID calculado)
        const historialDocRef = doc(
            db, 
            'usuarios', 
            userId, 
            'historial_consultas',
            docId // <-- ¡Usamos el ID único aquí!
        );

        // Datos a guardar/actualizar
        const dataToSave = {
            ...data,
            // Sobrescribir el timestamp a la hora de la consulta actual
            timestamp: Timestamp.fromDate(new Date()), 
        };

        // 3. Usar setDoc con { merge: true }
        // Si el documento existe (porque el ID es el mismo), lo actualiza (solo el timestamp).
        // Si no existe, lo crea.
        await setDoc(historialDocRef, dataToSave, { merge: true });
        
        console.log(`Actividad actualizada/registrada con éxito. ID de documento: ${docId}`);
    } catch (error) {
        console.error("Error al registrar/actualizar la actividad en Firestore:", error);
    }
};