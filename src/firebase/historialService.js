import { db } from '../firebase'; // Asegúrate que esta ruta es correcta
import { doc,setDoc, addDoc, Timestamp, updateDoc, increment } from 'firebase/firestore';


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

    if (!data.Marca || !data.Modelo || !data.Pieza) {
        console.error("Error: Datos incompletos para generar ID de historial. Se requiere Marca, Modelo y Pieza.");
        return;
    }

    // 1. Crear el ID de documento único
    const docId = createHistorialId(data.Marca, data.Modelo, data.Pieza);
    
    // 2. Definir la referencia al documento específico
    const historialDocRef = doc(
        db, 
        'usuarios', 
        userId, 
        'historial_consultas',
        docId
    );
    
    // Datos a guardar en el primer setDoc si no existe (o si se quiere actualizar todo el contenido)
    const baseDataToSave = {
        ...data,
        vistas: 1, // Valor inicial de vistas
        timestamp: Timestamp.fromDate(new Date()), // Timestamp de la consulta actual
    };

    // Datos a actualizar
    const dataToUpdate = {
        vistas: increment(1), // Incrementa el contador en 1
        timestamp: Timestamp.fromDate(new Date()), // Actualiza el timestamp de la última vista
    };

    try {
        // 3. Intentar actualizar el contador y el timestamp
        // Si el documento NO existe, esta operación FALLARÁ con 'not-found'.
        await updateDoc(historialDocRef, dataToUpdate);
        
        console.log(`Actividad actualizada (vistas incrementadas). ID de documento: ${docId}`);

    } catch (error) {
        // 4. Si el documento NO existe (o hay otro error que impide updateDoc), 
        // lo creamos usando setDoc.
        if (error.code === 'not-found' || error.message.includes('No document to update')) {
            await setDoc(historialDocRef, baseDataToSave);
            console.log(`Actividad creada (primera vista). ID de documento: ${docId}`);
        } else {
             // Revertimos al comportamiento anterior para cualquier otro error
             await setDoc(historialDocRef, baseDataToSave, { merge: true });
             console.error("Error al registrar/actualizar la actividad en Firestore, usando setDoc fallback:", error);
        }
    }
};