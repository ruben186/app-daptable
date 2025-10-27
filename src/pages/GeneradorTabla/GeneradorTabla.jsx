import React, { useState } from 'react';
// ⬅️ Importamos doc y setDoc para el ID personalizado
import { collection, doc, setDoc } from 'firebase/firestore'; 
import { db } from '../../firebase'; // Asegúrate de que esta ruta sea correcta
import './GeneradorTabla.css';

const GeneradorTabla = () => {
  const [nombre, setNombre] = useState('');
  const [modelo, setModelo] = useState('');
  const [marca, setMarca] = useState(''); // Estado para la marca
  const [tabla, setTabla] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [numCampos, setNumCampos] = useState(8);

  const marcasDisponibles = [
    'Samsung',
    'Motorola',
    'Redmi',
    'Huawei',
    'Otros',
  ];

  const generarCodigo = (index) => {
    // Es buena práctica incluir el modelo aquí si se usa como parte del ID del documento
    return `${nombre.toUpperCase()}-${modelo.toUpperCase()}-${Date.now()}-${index}`;
  };

  // Helper para generar el ID del documento basado en Nombre y Modelo
  const generarDocId = (nombre, modelo) => {
    // Limpia y formatea (Ej: 'Samsung Galaxy S21' -> 'SAMSUNG_GALAXY_S21')
    const nombreLimpio = nombre.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const modeloLimpio = modelo.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    return `${nombreLimpio}-${modeloLimpio}`;
  };

  // Nombres por defecto de los campos
  const nombresPorDefecto = [
    'PANTALLA',
    'VISOR',
    'VIDRIO TEMPLADO',
    'BATERIA',
    'FLEX DE BOTONES',
    'FLEX DESCARGA',
    'PUERTO DE CARGA',
    'AURICULAR',
  ];

  const generarTabla = () => {
    if (!nombre.trim() || !modelo.trim() || !marca.trim()) {
        alert("Por favor, selecciona una marca e ingresa el nombre y modelo antes de generar la tabla.");
        return;
    }

    const nuevaTabla = Array.from({ length: numCampos }, (_, i) => ({
      campo: nombresPorDefecto[i] || `Campo ${i + 1}`,
      codigo: generarCodigo(i + 1),
      codigoCompatibilidad: '',
    }));

    setTabla(nuevaTabla);
    setModoEdicion(false);
  };

  const editarCodigo = (index, nuevoCodigo) => {
    const copia = [...tabla];
    copia[index].codigo = nuevoCodigo;
    setTabla(copia);
  };

  const editarCampo = (index, nuevoCampo) => {
    const copia = [...tabla];
    copia[index].campo = nuevoCampo;
    setTabla(copia);
  };

  const editarCompatibilidad = (index, nuevoCodigo) => {
    const copia = [...tabla];
    copia[index].codigoCompatibilidad  = nuevoCodigo;
    setTabla(copia);
  };

  const eliminarTabla = () => {
    if (tabla.length === 0) return;
    const confirm = window.confirm('¿Deseas eliminar la tabla generada? Esta acción limpiará los datos en la interfaz.');
    if (!confirm) return;
    
    // Limpieza de estados en la interfaz
    setTabla([]);
    setNombre('');
    setModelo('');
    setMarca('');
    setModoEdicion(false);
    setNumCampos(8);
  };

  const cambiarNumCampos = (nuevoNum) => {
    const n = Math.max(1, parseInt(nuevoNum || 0, 10));
    setNumCampos(n);
    // ajustar tabla si ya existe
    if (tabla.length === 0) return;
    if (n > tabla.length) {
      const adicionales = Array.from({ length: n - tabla.length }, (_, i) => ({
        campo: nombresPorDefecto[tabla.length + i] || `Campo ${tabla.length + i + 1}`,
        codigo: generarCodigo(tabla.length + i + 1),
        codigoCompatibilidad: '',
      }));
      setTabla([...tabla, ...adicionales]);
    } else if (n < tabla.length) {
      setTabla(tabla.slice(0, n));
    }
  };

  // ⬅️ FUNCIÓN MODIFICADA: Guarda con ID personalizado y limpia
  const guardarTabla = async () => {
    if (!nombre.trim() || !modelo.trim() || !marca.trim()) {
        alert("La marca, el nombre y el modelo son obligatorios.");
        return;
    }

    try {
        // 1. Generar el ID usando nombre y modelo
        const docId = generarDocId(nombre, modelo);
        
        // 2. Usar 'doc' y 'setDoc' para guardar con el ID personalizado
        const docRef = doc(db, 'tablas', docId); 
        
        await setDoc(docRef, {
            nombre: nombre.trim().toUpperCase(), // Opcional: guardar en mayúsculas
            modelo: modelo.trim().toUpperCase(),
            marca,
            campos: tabla,
            fecha: new Date().toISOString(),
        });

        alert(`Tabla guardada en Firebase con ID: ${docId}. Campos limpiados.`);
        
        // 3. LIMPIAR TODOS LOS ESTADOS para una nueva tarea
        setNombre('');
        setModelo('');
        setMarca(''); 
        setTabla([]); 
        setModoEdicion(false); 
        setNumCampos(8);
        
    } catch (error) {
        console.error('Error al guardar en Firebase:', error);
        alert('Error al guardar en Firebase');
    }
  };

  return (
    <div className="generador-container">
      <h2>Ingresa Celular</h2>
      <div className="generador-form">
        {/* Campo de selección de marca */}
        <select
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          style={{ marginBottom: 8, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
        >
          <option value="" disabled>Selecciona una marca...</option>
          {marcasDisponibles.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        
        <input
          type="text"    
          placeholder="Ingresa un nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          type="text"
          placeholder="Ingresa el modelo"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          style={{ marginTop: 8 }}
        />
        <button onClick={generarTabla}>Generar Tabla</button>
      </div>

      {tabla.length > 0 && (
        <>
          <div className="generador-actions">
            <button
              onClick={() => setModoEdicion(!modoEdicion)}
              style={{ backgroundColor: '#FFD700', color: '#000' }}
            >
              {modoEdicion ? 'Cancelar' : 'Editar'}
            </button>
            {/* Control para cambiar el número de campos */}
            {modoEdicion && (
              <div style={{ display: 'inline-block', marginLeft: 12 }}>
                <label style={{ marginRight: 8 }}>Número de campos:</label>
                <input
                  type="number"
                  min={1}
                  value={numCampos}
                  onChange={(e) => cambiarNumCampos(e.target.value)}
                  style={{ width: 80 }}
                />
              </div>
            )}
            <button onClick={guardarTabla}>Guardar</button>
            <button
              className="eliminar-btn"
              onClick={eliminarTabla}
              style={{ backgroundColor: '#d9534f', color: '#fff', marginLeft: 8 }}
            >
              Eliminar Tabla
            </button>
          </div>

          <table className="generador-table">
            <thead>
              <tr>
                <th>Campo</th>
                <th>Código</th>
                <th>Código compatibilidad</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila, index) => (
                <tr key={index}>
                  <td>
                    {modoEdicion ? (
                      <input
                        type="text"
                        value={fila.campo}
                        onChange={(e) => editarCampo(index, e.target.value)}
                      />
                    ) : (
                      fila.campo
                    )}
                  </td>
                  <td>
                    {modoEdicion ? (
                      <input
                        type="text"
                        value={fila.codigo}
                        onChange={(e) => editarCodigo(index, e.target.value)}
                      />
                    ) : (
                      fila.codigo
                    )}
                  </td>
                  <td>
                    {modoEdicion ? (
                      <input
                        type="text"
                        value={fila.codigoCompatibilidad || ''}
                        onChange={(e) => editarCompatibilidad(index, e.target.value)}
                      />
                    ) : (
                      fila.codigoCompatibilidad || ''
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default GeneradorTabla;