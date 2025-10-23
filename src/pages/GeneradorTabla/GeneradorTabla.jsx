
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './GeneradorTabla.css';

const GeneradorTabla = () => {
  const [nombre, setNombre] = useState('');
  const [tabla, setTabla] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);

  const generarCodigo = (index) => {
    return `${nombre.toUpperCase()}-${Date.now()}-${index}`;
  };

  const generarTabla = () => {
    if (!nombre.trim()) return;

    const nuevaTabla = Array.from({ length: 8 }, (_, i) => ({
      campo: `Campo ${i + 1}`,
      codigo: generarCodigo(i + 1),
    }));

    setTabla(nuevaTabla);
    setModoEdicion(false);
  };

  const editarCodigo = (index, nuevoCodigo) => {
    const copia = [...tabla];
    copia[index].codigo = nuevoCodigo;
    setTabla(copia);
  };

  const guardarTabla = async () => {
    try {
      const docRef = await addDoc(collection(db, 'tablas'), {
        nombre,
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
        <button onClick={generarTabla}>Generar Tabla</button>
      </div>

      {tabla.length > 0 && (
        <>
          <div className="generador-actions">
            <button onClick={() => setModoEdicion(!modoEdicion)}>
              {modoEdicion ? 'Cancelar Edición' : 'Editar Tabla'}
            </button>
            <button onClick={guardarTabla}>Guardar</button>
          </div>

          <table className="generador-table">
            <thead>
              <tr>
                <th>Campo</th>
                <th>Código</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila, index) => (
                <tr key={index}>
                  <td>{fila.campo}</td>
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
