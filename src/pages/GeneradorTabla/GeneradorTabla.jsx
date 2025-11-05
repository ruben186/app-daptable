import React, { useState } from 'react';
// ⬅️ Importamos doc y setDoc para el ID personalizado
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore'; 
import { db } from '../../firebase'; // Asegúrate de que esta ruta sea correcta
import './GeneradorTabla.css';
import NavBar from '../components/NavBarPage';

const GeneradorTabla = () => {
  const [nombre, setNombre] = useState('');
  const [modelo, setModelo] = useState('');
  const [marca, setMarca] = useState(''); // Estado para la marca
  const [searchQuery, setSearchQuery] = useState('');
  const [tabla, setTabla] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [numCampos, setNumCampos] = useState(7);
  const [remoteTablas, setRemoteTablas] = useState([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aggregatedRows, setAggregatedRows] = useState([]);
  const [aggregatedMode, setAggregatedMode] = useState(false);
  const [tableGenerated, setTableGenerated] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [nuevoModeloInput, setNuevoModeloInput] = useState('');

  const marcasDisponibles = [
    'Samsung',
    'Motorola',
    'Redmi',
    'Huawei',
    'Otros',
  ];

  // Genera el código para un campo usando la base: nombre (sin espacios, lowercase) + modelo
  // Ahora el código NO incluye el nombre del campo, solo la base y el contador: ej. motog7powerXT1962-4-1
  const generarCodigo = (index) => {
    // Formato: NOMBRE (tal como se ingresó, mayúsculas) - MODELO - índice
    const nombreForCode = (nombre || '').toString().trim().toUpperCase();
    const modeloForCode = (modelo || '').toString().trim();
    return `${nombreForCode}-${modeloForCode}-${index}`;
  };

  // Generar tabla usando un modelo proporcionado manualmente (evita depender del setState asincrónico)
  const generarTablaConModeloManual = (modeloManual) => {
    const q = (searchQuery || '').toString().trim();
    if (!q) {
      alert('Por favor escribe en la caja de búsqueda un nombre antes de generar la tabla.');
      return;
    }
    const parsed = parseNameModelFromQuery(q);
    const nombreParsed = parsed.name || q;
    const modeloUsed = (modeloManual || '').toString().trim();
    if (!modeloUsed) {
      alert('Por favor ingresa un modelo válido.');
      return;
    }

    // Actualizar estados
    setNombre(nombreParsed);
    setModelo(modeloUsed);

    // Crear la tabla con los códigos en el formato requerido
    // Usar los nombres por defecto solicitados y actualizar numCampos
    const camposToUse = nombresPorDefecto.slice(0); // los 7 campos solicitados
    setNumCampos(camposToUse.length);
    const nuevaTabla = camposToUse.map((campoNombre, i) => {
      const codigo = `${nombreParsed.trim().toUpperCase()}-${modeloUsed}-${i + 1}`;
      const codigoCompatibilidad = '';
      return {
        campo: campoNombre,
        codigo,
        codigoCompatibilidad,
      };
    });
    setNuevoModeloInput('');
    setTabla(nuevaTabla);
    setModoEdicion(false);
    setTableGenerated(true);
    setShowResults(true);
  };

  // Helper para generar el ID del documento basado en Nombre y Modelo
  const generarDocId = (nombre, modelo) => {
    // Concatenar nombre (sin espacios, lowercase) y modelo tal cual (trimmed)
    const nombreLimpio = nombre.trim().replace(/\s+/g, '').toLowerCase();
    const modeloLimpio = modelo.trim();
    return `${nombreLimpio}${modeloLimpio}`;
  };

  // Nombres por defecto de los campos (piezas del celular)
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

  const parseNameModelFromQuery = (q) => {
    const parts = (q || '').toString().trim().split(/\s+/);
    if (parts.length === 0) return { name: '', model: '' };
    if (parts.length === 1) return { name: parts[0], model: '' };
    const model = parts[parts.length - 1];
    const name = parts.slice(0, parts.length - 1).join(' ');
    return { name, model };
  };

  // Note: generation moved to generarTablaConModeloManual which handles both manual modelo and parsed modelo

  // Extrae todo el texto (strings/números/booleans) de un objeto o array de forma recursiva
  // Devuelve una única cadena en minúsculas para búsquedas "contains"
  const extractText = (value) => {
    const parts = [];
    const normalizeString = (s) => {
      if (s === null || s === undefined) return '';
      // quitar diacríticos, normalizar a ascii, reemplazar guiones/underscores por espacios y dejar solo caracteres legibles
      try {
        return String(s)
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[-_]+/g, ' ')
          .replace(/[^\p{L}\p{N}]+/gu, ' ')
          .trim()
          .replace(/\s+/g, ' ');
      } catch (e) {
        // Fallback for environments without Unicode property escapes
        return String(s)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[-_]+/g, ' ')
          .replace(/[^a-z0-9 ]+/g, ' ')
          .trim()
          .replace(/\s+/g, ' ');
      }
    };
    const helper = (v) => {
      if (v === null || v === undefined) return;
      const t = typeof v;
      if (t === 'string' || t === 'number' || t === 'boolean') {
        parts.push(normalizeString(v));
      } else if (Array.isArray(v)) {
        v.forEach(helper);
      } else if (t === 'object') {
        Object.values(v).forEach(helper);
      }
    };
    helper(value);
    return parts.join(' ');
  };

  // Fetch remote tablas once the user focuses the search input
  const fetchRemoteTablas = async () => {
    if (remoteTablas.length > 0 || remoteLoading) return;
    setRemoteLoading(true);
    try {
      const col = collection(db, 'tablas');
      const snap = await getDocs(col);
      const docs = [];
      snap.forEach(d => {
        docs.push({ _id: d.id, ...d.data() });
      });
      setRemoteTablas(docs);
    } catch (err) {
      console.error('Error fetching remote tablas:', err);
    } finally {
      setRemoteLoading(false);
    }
  };

  // Filtrado en vivo de la tabla según searchQuery y la marca seleccionada
  const matchesQuery = (fila) => {
    const rawQ = (searchQuery || '').toString();
    const q = rawQ ? rawQ.toLowerCase().trim() : '';
    // normalize query same way we normalize doc text
    const normalizeQuery = (s) => {
      if (!s) return '';
      try {
        return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[-_]+/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
      } catch (e) {
        return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-_]+/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').trim().replace(/\s+/g, ' ');
      }
    };
    const qNorm = normalizeQuery(q);
    // Si no hay filtro, mostramos todo
    if (!qNorm && !marca) return true;

    // Construir un objeto combinando la fila con los metadatos globales para buscar en todos los campos
    const combined = {
      ...fila,
      nombre: nombre || '',
      modelo: modelo || '',
      marca: marca || '',
    };

    // Extraer todo el texto disponible y comparar
    const hayTexto = extractText(combined);
    if (!qNorm) return true;
    return hayTexto.includes(qNorm);
  };

  // Update suggestions from remoteTablas based on current searchQuery
  const updateSuggestions = (q) => {
    const qlRaw = (q || '').toString();
    const ql = qlRaw ? qlRaw.toLowerCase().trim() : '';
    // normalize query
    const normalizeQuerySimple = (s) => {
      if (!s) return '';
      try {
        return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[-_]+/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
      } catch (e) {
        return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-_]+/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').trim().replace(/\s+/g, ' ');
      }
    };
    const qlNorm = normalizeQuerySimple(ql);
    if (!qlNorm) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const found = [];
    const agg = [];
    remoteTablas.forEach((d) => {
      // suggestions: add up to 6 matching documents
      if (found.length < 6) {
        const docText = (extractText(d) + ' ' + (d._id || '')).toString().toLowerCase();
        if (docText.includes(qlNorm)) {
          found.push(d);
        }
      }

      // aggregated rows: for every campo in the document, if the combined row text matches, add to agg
      const campos = Array.isArray(d.campos) ? d.campos : [];
      campos.forEach((c) => {
        const combinedRow = {
          nombre: d.nombre || '',
          modelo: d.modelo || '',
          marca: d.marca || '',
          _id: d._id || '',
          ...c,
        };
        const rowText = extractText(combinedRow);
        if (rowText.includes(qlNorm)) {
          agg.push(combinedRow);
        }
      });
    });

    setSuggestions(found.slice(0,6));
    setShowSuggestions(found.length > 0);
    // If there are aggregated matches, enable aggregatedMode and store rows
    if (agg.length > 0) {
      setAggregatedRows(agg);
      setAggregatedMode(true);
    } else {
      setAggregatedRows([]);
      setAggregatedMode(false);
    }
  };

  // Exportar filas (filtradas) a CSV
  const exportToCSV = (rowsParam) => {
    const rows = Array.isArray(rowsParam) ? rowsParam : tabla.filter((f) => matchesQuery(f));
    if (!rows.length) {
      alert('No hay filas para exportar');
      return;
    }

    const headers = ['Nombre', 'Modelo', 'Marca', 'Pieza', 'Código', 'Código compatibilidad'];
    const csvLines = [];
    csvLines.push(headers.join(','));
    rows.forEach((r) => {
      // Escape comas si es necesario
      const safe = (s) => `"${(s || '').toString().replace(/"/g, '""')}"`;
      const rowNombre = (r && r.nombre) ? r.nombre : nombre;
      const rowModelo = (r && r.modelo) ? r.modelo : modelo;
      const rowMarca = (r && r.marca) ? r.marca : marca;
      csvLines.push([safe(rowNombre), safe(rowModelo), safe(rowMarca), safe(r.campo), safe(r.codigo), safe(r.codigoCompatibilidad || '')].join(','));
    });

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
  const baseName = (rowsParam && aggregatedMode) ? (searchQuery ? searchQuery.replace(/\s+/g, '_') : 'resultados') : (generarDocId(nombre, modelo) || 'tabla');
  a.download = `${baseName}_export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    setNumCampos(7);
  };

  const cambiarNumCampos = (nuevoNum) => {
    const n = Math.max(1, parseInt(nuevoNum || 0, 10));
    setNumCampos(n);
    // ajustar tabla si ya existe
    if (tabla.length === 0) return;
    if (n > tabla.length) {
      const adicionales = Array.from({ length: n - tabla.length }, (_, i) => {
        const idx = tabla.length + i;
        const campoNombre = nombresPorDefecto[idx] || `Campo ${idx + 1}`;
        return {
          campo: campoNombre,
          codigo: generarCodigo(idx + 1),
          codigoCompatibilidad: '',
        };
      });
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

    // 2. Referencia al documento
    const docRef = doc(db, 'tablas', docId);

    // 3. Comprobar si el documento ya existe para prevenir sobreescritura sin confirmación
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      const confirmar = window.confirm(`Ya existe una tabla con ID ${docId}. ¿Deseas sobrescribirla?`);
      if (!confirmar) {
        alert('Guardado cancelado. No se sobrescribió el documento existente.');
        return;
      }
    }

    // 4. Guardar (sobrescribe si el usuario confirmó)
    await setDoc(docRef, {
      nombre: nombre.trim().toUpperCase(), // Opcional: guardar en mayúsculas
      modelo: modelo.trim().toUpperCase(),
      marca,
      campos: tabla,
      fecha: new Date().toISOString(),
    });

    alert(`Tabla guardada en Firebase con ID: ${docId}. Campos limpiados.`);

    // 5. LIMPIAR TODOS LOS ESTADOS para una nueva tarea
    setNombre('');
    setModelo('');
    setMarca('');
    setTabla([]);
    setModoEdicion(false);
  setNumCampos(7);

  } catch (error) {
    console.error('Error al guardar en Firebase:', error);
    alert('Error al guardar en Firebase');
  }
  };

  return (
    <div className="page-offset">
      <NavBar/>
      <div className="generador-container">
        <h2>Ingresa Celular</h2>
        {/* calcular filas filtradas para usar en botones y tabla */}
        {/* filteredRows se usa en el render para habilitar/deshabilitar Exportar */}
        {(() => {})()}
        <div className="generador-form">
          {/* Search input at the start of the form (replaces name/model inputs) */}
          <div className="search-row" style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Buscar celular (ej: pantalla, moto g7, XT1962-4)"
              value={searchQuery}
              onFocus={() => { fetchRemoteTablas(); setShowSuggestions(true); updateSuggestions(searchQuery); }}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQuery(v);
                if (!v || v.toString().trim() === '') {
                  // if cleared, hide suggestions and results
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setAggregatedMode(false);
                  setShowResults(false);
                  setTableGenerated(false);
                  return;
                }
                // Ensure remote tablas are loaded when user types
                if (remoteTablas.length === 0 && !remoteLoading) fetchRemoteTablas();
                updateSuggestions(v);
                // typing a new query should hide any previously generated table until user confirms
                setTableGenerated(false);
                setShowResults(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="search-input"
            />
            {showSuggestions && suggestions && suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map((s) => (
                  <div key={s._id} className="suggestion-item" onMouseDown={() => {
                    // onMouseDown to capture click before input blur
                    setNombre(s.nombre || '');
                    setModelo(s.modelo || '');
                    setMarca(s.marca || '');
                    setTabla(s.campos || []);
                    setSearchQuery(`${s.nombre || ''} ${s.modelo || ''}`.trim());
                    setShowSuggestions(false);
                    setAggregatedMode(false);
                    // selecting a suggestion should not show action buttons until the user explicitly presses Generar Tabla
                    setTableGenerated(false);
                  }}>
                    <strong>{s.nombre}</strong> {s.modelo ? <span style={{ color: '#666' }}>{s.modelo}</span> : null}
                    <div style={{ fontSize: 12, color: '#999' }}>ID: {s._id}</div>
                  </div>
                ))}
              </div>
            )}
      </div>
        </div>

        {showResults && (
          <>
            {tableGenerated && (aggregatedMode ? aggregatedRows.length > 0 : tabla.filter((f) => matchesQuery(f)).length > 0) && (
            <div className="generador-actions">
              <button className="btn btn-gold" onClick={() => { setModoEdicion(!modoEdicion); setAggregatedMode(false); }}>{modoEdicion ? 'Cancelar' : 'Editar'}</button>
              {/* Brand select shown after generating the table */}
              <div style={{ display: 'inline-block', marginLeft: 12 }}>
                <label style={{ marginRight: 8 }}>Marca:</label>
                <select
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="brand-select"
                >
                  <option value="">-- Selecciona marca --</option>
                  {marcasDisponibles.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* search is in the main form now */}
              {/* Control para cambiar el número de campos */}
              {modoEdicion && (
                <div className="num-campos">
                  <label>Número de campos:</label>
                  <input
                    type="number"
                    min={1}
                    value={numCampos}
                    onChange={(e) => cambiarNumCampos(e.target.value)}
                    className="small-input number-input"
                  />
                </div>
              )}
              <button onClick={() => { guardarTabla(); setAggregatedMode(false); }}>Guardar</button>
            </div>
            )}

            {/** Compute displayed rows applying search and marca filter **/}
              { (() => {
                if (aggregatedMode) {
                  const rowsAgg = aggregatedRows;
                  if (!rowsAgg.length) {
                    return (
                      <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                        No se encontraron resultados para la búsqueda.
                      </div>
                    );
                  }
                  return (

                    <>
                    <button className="btn btn-gold" onClick={() => { setModoEdicion(!modoEdicion); }}>{modoEdicion ? 'Cancelar' : 'Editar'}</button>

                    <button className="btn btn-success" onClick={() => exportToCSV(aggregatedMode ? aggregatedRows : tabla.filter((f) => matchesQuery(f)))} style={{ marginLeft: 8 }}>Exportar CSV</button>
                    <button className="btn btn-danger eliminar-btn" onClick={eliminarTabla}>Eliminar Tabla</button>

                    <table className="generador-table">
                      <thead>
                        
                        <tr>
                          <th>Nombre</th>
                          <th>Modelo</th>
                          <th>Marca</th>
                          <th>Pieza</th>
                          <th>Código</th>
                          <th>Código compatibilidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowsAgg.map((fila, index) => (
                          <tr key={`${fila._id || 'r'}-${index}`}>
                            <td>
                            {modoEdicion ? (
                              <input
                                type="text"
                                value={fila.nombre}
                                onChange={(e) => editarCampo(index, e.target.value)}
                              />
                                )  
                              
                          : (fila.nombre)}</td>

                            <td>
                            {modoEdicion ? (
                              <input
                                type="text"
                                value={fila.modelo}
                                onChange={(e) => editarCampo(index, e.target.value)}
                              />
                            
                            ) 
                              : (fila.modelo)}</td>
                            
                                
                            <td>
                            {modoEdicion ? (
                              <input
                                type="text"
                                value={fila.campo}
                                onChange={(e) => editarCampo(index, e.target.value)}
                              />
                            ) 
                              : (fila.campo)}</td>

                            <td>{
                              modoEdicion ? (
                              <input
                                type="text"
                                value={fila.codigo}
                                onChange={(e) => editarCampo(index, e.target.value)}
                              />
                            ) 
                              : (fila.codigo)
                              }</td>

                            <td>{
                            modoEdicion ? (
                              <input
                                type="text"
                                value={fila.codigoCompatibilidad|| ''}
                                onChange={(e) => editarCampo(index, e.target.value)}
                              />
                            ) 
                              : (fila.codigoCompatibilidad || '')
                            
                              }</td>
                          </tr>

                        ))}
                      </tbody>
                    </table>
                    </>
                    
                  );
              }

              const rows = tabla.filter((f) => matchesQuery(f));
              if (!rows.length) {
                return (
                  <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                    <div>No se encontraron resultados.</div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ display: 'block', marginBottom: 6 }}>Ingrese el modelo del celular para generarlo:</label>
                      <input
                        type="text"
                        name="nuevoModelo"
                        placeholder="Ej: XT1962-4 (Modelo del celular)"
                        value={nuevoModeloInput}
                        onChange={(e) => setNuevoModeloInput(e.target.value)}
                        className="small-input"
                      />
                      <button
                        className="btn btn-primary"
                        style={{ marginLeft: 8 }}
                        onClick={() => generarTablaConModeloManual(nuevoModeloInput)}
                      
                      >Generar ahora</button>
                    </div>
                  </div>
                );
              }

              return (
                <table className="generador-table">
                  <thead>
                    <tr>
                      <th>pieza</th>
                      <th>Código</th>
                      <th>Código compatibilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((fila, index) => (
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
              );
            })() }
          
        </>
      )}
      </div>
    </div>
  );
};

export default GeneradorTabla;