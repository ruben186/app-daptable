
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './GeneradorTabla.css';

const GeneradorTabla = () => {
  const [nombre, setNombre] = useState('');
  const [modelo, setModelo] = useState('');
  const [tabla, setTabla] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [numCampos, setNumCampos] = useState(8);

  const generarCodigo = (index) => {
    return `${nombre.toUpperCase()}-${Date.now()}-${index}`;
  };

  // Nombres por defecto basados en la imagen proporcionada
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
    if (!nombre.trim()) return;

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
    copia[index].codigoCompatibilidad = nuevoCodigo;
    setTabla(copia);
  };

  const eliminarTabla = () => {
    if (tabla.length === 0) return;
    const confirm = window.confirm('¿Deseas eliminar la tabla generada? Esta acción limpiará los datos en la interfaz.');
    if (!confirm) return;
    // Nota: esto solo elimina la tabla en la interfaz. Si quieres eliminarla también de Firebase,
    // necesitamos el ID del documento (guardarTabla podría devolverlo y almacenarlo en estado).
    setTabla([]);
    setNombre('');
    setModoEdicion(false);
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

  const guardarTabla = async () => {
    try {
      const docRef = await addDoc(collection(db, 'tablas'), {
        nombre,
        modelo,
        campos: tabla,
        fecha: new Date().toISOString(),
      });
      alert('Tabla guardada en Firebase con ID: ' + docRef.id);
      setModoEdicion(false);
    } catch (error) {
      console.error('Error al guardar en Firebase:', error);
      alert('Error al guardar en Firebase');
    }
  };

  return (
    <div className="generador-container">
      <h2>Generador de Tabla</h2>
      <div className="generador-form">
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
            {/* Cuando estamos en modo edición, permitimos cambiar el número de campos */}
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
