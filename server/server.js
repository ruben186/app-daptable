const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');


const app = express();
// Usamos el puerto 3001 para el backend (React usa 3000)
const port = 3001; 

// --- Configuración de Multer ---

const uploadDir = path.join(__dirname, 'uploads');

// Asegurarse de que el directorio 'uploads' existe antes de iniciar
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // La carpeta 'uploads' debe existir
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `archivo-${Date.now()}_${Math.random().toString(36).substring(2)}${ext}`;
    cb(null, uniqueName);
  }
});


const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      // Rechaza otros tipos de archivo
      cb(new Error('Solo se permiten archivos PDF'), false); 
    }
  }
});

// --- Middleware y CORS ---

// Configuración de CORS para permitir la comunicación con React (http://localhost:3000)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); 
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Servir la carpeta 'uploads' estáticamente para que el frontend pueda acceder a los archivos
app.use('/uploads', express.static(uploadDir)); 

// --- Ruta de Subida ---

// ENDPOINT PRINCIPAL: http://localhost:3001/api/upload-pdf
app.post('/api/upload-pdf', upload.single('archivo'), (req, res) => {
  if (!req.file) {
    const multerError = req.fileFilterError ? req.fileFilterError.message : 'Error al procesar el archivo.';
    return res.status(400).json({ success: false, message: multerError });
  }

  // Éxito: El archivo está guardado en el servidor.
  const newFilename = req.file.filename;
  const fileUrl = `http://localhost:${port}/uploads/${newFilename}`;
  const oldFileUrl = req.body.oldFileUrl;

  if (oldFileUrl && typeof oldFileUrl === 'string' && oldFileUrl.includes('/uploads/')) {
        try {
            // 1. Extraer el nombre del archivo de la URL (más seguro que new URL)
            const urlParts = oldFileUrl.split('/');
            let oldFilename = urlParts[urlParts.length - 1]; 

            // Limpiar cualquier parámetro de consulta (ej: si termina en ?v=123)
            oldFilename = oldFilename.split('?')[0]; 
            
            const oldPath = path.join(uploadDir, oldFilename);

            console.log('Nombre de archivo antiguo extraído:', oldFilename);
            console.log('Ruta completa a intentar eliminar:', oldPath);
            
            // 2. Intentar eliminar
            if (fs.existsSync(oldPath)) {
                fs.unlink(oldPath, (err) => {
                    if (err) {
                        // Error de sistema de archivos (ej: permisos)
                        console.error(' ERROR FS: No se pudo eliminar el archivo. Verifique permisos:', err);
                    } else {
                        console.log(` Archivo antiguo eliminado exitosamente: ${oldFilename}`);
                    }
                });
            } else {
                 console.log(` ADVERTENCIA: Archivo antiguo no encontrado en disco: ${oldPath}`);
            }
        } catch (e) {
            console.error(" ERROR GENERAL en la lógica de eliminación:", e);
        }
    } else {
        console.log('INFO: No se proporcionó una URL antigua válida para eliminación.');
    }

  res.status(200).json({
    success: true,
    message: 'Archivo subido exitosamente.',
    url: fileUrl // URL que se guardará en Firestore
  });
}, (err, req, res, next) => {
    // Manejo de errores de Multer
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Error de subida: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
});

// Inicio del Servidor
app.listen(port, () => {
  console.log(`🚀 Servidor de archivos Node.js/Express escuchando en http://localhost:${port}`);
});