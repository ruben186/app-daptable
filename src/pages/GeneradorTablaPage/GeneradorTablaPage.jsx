import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore'; 
import { Modal, Button, Form } from 'react-bootstrap';
import { db } from '../../firebase';
import './GeneradorTablaPage.css';
import NavBar from '../components/NavBarPage';
import Swal from 'sweetalert2';
import { FaPlus } from 'react-icons/fa';
import IconoEliminar from '../../assets/Iconos/iconoEliminar.png';

const GeneradorTabla = () => {
  const [nombre, setNombre] = useState('');
  const [modelo, setModelo] = useState('');
  const [marca, setMarca] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tabla, setTabla] = useState([]);
  const [modoEdicionLocal, setModoEdicionLocal] = useState(false);
  const [modoEdicionAgregada, setModoEdicionAgregada] = useState(false);
  const [numCampos, setNumCampos] = useState(7);
  const [remoteTablas, setRemoteTablas] = useState([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [aggregatedRows, setAggregatedRows] = useState([]);
  const [aggregatedMode, setAggregatedMode] = useState(false);
  const [tableGenerated, setTableGenerated] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [nuevoModeloInput, setNuevoModeloInput] = useState('');
  const [marcasDisponibles, setMarcasDisponibles] = useState(['Otros']);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevaMarcaInput, setNuevaMarcaInput] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchMarcasUnicas = async () => {
      try {
        const coleccionRef = collection(db, 'tablas'); 
        const snapshot = await getDocs(coleccionRef);
        const marcasSet = new Set();
        const params = new URLSearchParams(location.search);
        const queryFromUrl = params.get('query');
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const marca = data.marca;
          
          if (marca && typeof marca === 'string') {
            marcasSet.add(marca.trim()); 
          }
        });
        const listaMarcas = [...Array.from(marcasSet), 'Otros'];
        setMarcasDisponibles(listaMarcas);

        if (queryFromUrl) {
          const decodedQuery = decodeURIComponent(queryFromUrl);
          if (remoteTablas.length === 0 && !remoteLoading) {
            fetchRemoteTablas(); 
          }
          setSearchQuery(decodedQuery);
          updateSuggestions(decodedQuery); 
          setShowResults(true); 
          setModoEdicionAgregada(true);
        }

      } catch (error) {
        console.error("Error al obtener las marcas de Firebase: ", error);
        setMarcasDisponibles(['Error de carga', 'Otros']);
      }
    };

    fetchMarcasUnicas();
  }, [location.search, remoteTablas.length]);

  const handleAgregarMarca = () => {
    if (!nuevaMarcaInput.trim()) {
      Swal.fire({
        title:"¡Error!", 
        text: "Por favor, ingresa un nombre de marca válido.", 
        icon: "error",
        background: '#052b27ff',
        color: '#fff2f2ff',
        confirmButtonColor: '#0b6860ff',
      })
      return;
    }
    const nuevaMarcaNormalizada = nuevaMarcaInput.trim();
  
    // Verificación marca duplicada
    if (marcasDisponibles.includes(nuevaMarcaNormalizada)) {
      Swal.fire({
        title:"¡Ya existe!", 
        text: "Esa marca ya existe en la lista.", 
        icon: "warning",
        background: '#052b27ff',
        color: '#fff2f2ff',
        confirmButtonColor: '#0b6860ff',
      })
      setNuevaMarcaInput('');
      setMostrarModal(false);
      return;
    }
      
    const listaSinOtros = marcasDisponibles.filter(m => m !== 'Otros');
    const nuevaListaMarcas = [...listaSinOtros, nuevaMarcaNormalizada, 'Otros'];

    setMarcasDisponibles(nuevaListaMarcas);
    setMarca(nuevaMarcaNormalizada);
    setNuevaMarcaInput('');
    setMostrarModal(false);
  };

  // Genera el código para un campo
  const generarCodigo = (index) => {
    const nombreForCode = (nombre || '').toString().trim().toUpperCase();
    const modeloForCode = (modelo || '').toString().trim();
    return `${nombreForCode}-${modeloForCode}-${index}`;
  };

  const generarTablaConModeloManual = (modeloManual) => {
    const q = (searchQuery || '').toString().trim();
    if (!q) {
      Swal.fire({
        title:"¡Error!", 
        text: "Por favor escribe en la caja de búsqueda un nombre antes de generar la tabla.", 
        icon: "error",
        background: '#052b27ff',
        color: '#fff2f2ff',
        confirmButtonColor: '#0b6860ff',
      })
      return;
    }

    const nombreParsed = q;
    const modeloUsed = (modeloManual || '').toString().trim();
    if (!modeloUsed) {
      Swal.fire({
        title:"¡Error!", 
        text: "Por favor ingresa un modelo válido.", 
        icon: "error",
        background: '#052b27ff',
        color: '#fff2f2ff',
        confirmButtonColor: '#0b6860ff',
      })
      return;
    }

    setNombre(nombreParsed);
    setModelo(modeloUsed);

    // Crear la tabla con los códigos en el formato requerido
    const camposToUse = nombresPorDefecto.slice(0);
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
    setModoEdicionLocal(false);
    setTableGenerated(true);
    setShowResults(true);
    setModoEdicionAgregada(false);
  };

  // Normalizar el ID del documento basado en Nombre y Modelo
  const generarDocId = (nombre, modelo) => {
    const nombreLimpio = nombre.trim().replace(/\s+/g, '').toLowerCase();
    const modeloLimpio = modelo.trim();
    return `${nombreLimpio}${modeloLimpio}`;
  };

  // Nombres por defecto de los campos
  const nombresPorDefecto = [
    'PANTALLA',
    'VISOR',
    'VIDRIO TEMPLADO',
    'BATERIA',
    'FLEX DE BOTONES',
    'FLEX DE CARGA',
    'PUERTO DE CARGA',
    'AURICULAR',
  ];

  const extractText = (value) => {
    const parts = [];
    const normalizeString = (s) => {
      if (s === null || s === undefined) return '';
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

  //Obtener tablas de celulares y piezas al entrar en busqueda
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

  // Filtrado en vivo de la tabla
  const matchesQuery = (fila) => {
    const rawQ = (searchQuery || '').toString();
    const q = rawQ ? rawQ.toLowerCase().trim() : '';
    const normalizeQuery = (s) => {
      if (!s) return '';
      try {
        return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[-_]+/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
      } catch (e) {
        return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-_]+/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').trim().replace(/\s+/g, ' ');
      }
    };
    const qNorm = normalizeQuery(q);
    if (!qNorm && !marca) return true;

    const combined = {
      ...fila,
      nombre: nombre || '',
      modelo: modelo || '',
      marca: marca || '',
    };

    const hayTexto = extractText(combined);
    if (!qNorm) return true;
    return hayTexto.includes(qNorm);
  };

  // Actualizar sugerencias de tablas segun la busqueda
 const updateSuggestions = (q) => {
    const qlRaw = (q || '').toString();
    const ql = qlRaw ? qlRaw.toLowerCase().trim() : '';
    const normalizeQuerySimple = (s) => {
     if (!s) return '';
      try {
        return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[-_]+/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
      } catch (e) {
        return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-_]+/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').trim().replace(/\s+/g, ' ');
      }
    };

    const qlNorm = normalizeQuerySimple(ql);
    const qlTerms = qlNorm.split(' ').filter(term => term.length > 0);
    const found = [];
    const agg = [];

    remoteTablas.forEach((d) => {
      if (found.length < 6) {
        const docText = (extractText(d) + ' ' + (d._id || '')).toString().toLowerCase();
        const allTermsMatch = qlTerms.every(term => docText.includes(term));

        if (allTermsMatch) { 
          found.push(d);
        }
      }

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
        const allRowTermsMatch = qlTerms.every(term => rowText.includes(term));

        if (allRowTermsMatch) {
          agg.push(combinedRow);
         }
      });
    });

    if (agg.length > 0) {
      setAggregatedRows(agg);
      setAggregatedMode(true);
    } else {
      setAggregatedRows([]);
      setAggregatedMode(false);
    }
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

  const cambiarNumCampos = (nuevoNum) => {
    const n = Math.max(1, parseInt(nuevoNum || 0, 10));
    setNumCampos(n);
    // Ajustar tabla si ya existe
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

  // Guarda con ID personalizado y limpia
  const guardarTabla = async () => {
    if (!nombre.trim() || !modelo.trim() || !marca.trim()) {
        alert("La marca, el nombre y el modelo son obligatorios.");
        return;
    }

    try {
      // Genera el ID usando nombre y modelo
      const docId = generarDocId(nombre, modelo);
      const docRef = doc(db, 'tablas', docId);
      const existing = await getDoc(docRef);

      if (existing.exists()) {
        const confirmar = window.confirm(`Ya existe una tabla con ID ${docId}. ¿Deseas sobrescribirla?`);
        if (!confirmar) {
          alert('Guardado cancelado. No se sobrescribió el documento existente.');
          return;
        }
      }

      await setDoc(docRef, {
        nombre: nombre.trim().toUpperCase(),
        modelo: modelo.trim().toUpperCase(),
        marca,
        campos: tabla,
        fecha: new Date().toISOString(),
      });

      Swal.fire({
        title:"¡Celular Guardado!", 
        text: `Celular guardado correctamente en Firebase con ID: ${docId}.`, 
        icon: "success",
        background: '#052b27ff',
        color: '#ffffffff',
        confirmButtonColor: '#0b6860ff',
      })
      //Limpiar estados
      setNombre('');
      setModelo('');
      setMarca('');
      setTabla([]);
      setModoEdicionLocal(false);
      setNumCampos(7);

    } catch (error) {
      console.error('Error al guardar en Firebase:', error);
      alert('Error al guardar en Firebase');
    }
  };

  const guardarCambiosAgregados = async () => {
    const cambiosPorDoc = aggregatedRows.reduce((acc, fila) => {
      const docId = fila._id;
      if (!acc[docId]) {
        acc[docId] = {
          nombre: fila.nombre,
          modelo: fila.modelo,
          marca: fila.marca,
          campos: [],
        };
      }
      acc[docId].campos.push({
        campo: fila.campo,
        codigo: fila.codigo,
        codigoCompatibilidad: fila.codigoCompatibilidad,
      });
      return acc;
    }, {});

    try {
      const docIdsModificados = Object.keys(cambiosPorDoc);
    
      for (const docId of docIdsModificados) {
        const data = cambiosPorDoc[docId];
        const docRef = doc(db, 'tablas', docId);
        if (!data.campos || data.campos.length === 0) {
          // Si no quedaron campos, eliminar el documento por completo
          await deleteDoc(docRef);
        } else {
          await updateDoc(docRef, {
            campos: data.campos,
            fecha: new Date().toISOString(),
          });
        }
      }

      Swal.fire({
        title:'Actualizado', 
        text: 'Se guardaron los cambios', 
        icon: 'success',
        background: '#052b27ff',
        color: '#ffdfdfff',
        confirmButtonColor: '#0b6860ff'
      });

      // Salir del modo edición después de guardar
      setModoEdicionAgregada(false);
    } catch (error) {
      console.error('Error al guardar cambios agregados:', error);
      alert('Error al guardar algunos cambios agregados.');
    }
  };

  const editarCompatibilidadAgregada = (rowIndex, newValue) => {
    setAggregatedRows(prevRows => {
      const newRows = [...prevRows];
      newRows[rowIndex].codigoCompatibilidad = newValue;
      return newRows;
    });
  };

  const agregarFila = () => {
    // Verificar si esta en modo edición y si hay filas para usar como base
    if (!modoEdicionAgregada || aggregatedRows.length === 0) {
        alert("Primero debes entrar en modo edición y tener resultados de búsqueda.");
        return;
    }

    const baseFila = aggregatedRows[0];
    const docId = baseFila._id;
    const camposExistentes = aggregatedRows.filter(fila => fila._id === docId);
    const nuevoIndice = camposExistentes.length + 1; 
    const nombreForCode = (baseFila.nombre || '').toString().trim().toUpperCase();
    const modeloForCode = (baseFila.modelo || '').toString().trim();
    const nuevoCodigo = `${nombreForCode}-${modeloForCode}-${nuevoIndice}`;

    const nuevaFila = {
        _id: docId, 
        nombre: baseFila.nombre,
        modelo: baseFila.modelo,
        marca: baseFila.marca,
        campo: `Pieza ${nuevoIndice}`, 
        codigo: nuevoCodigo, 
        codigoCompatibilidad: '',
        isNew: true, 
    };

    setAggregatedRows(prevRows => [...prevRows, nuevaFila]);
  };

  const editarCampoAgregado = (rowIndex, newValue) => {
    const nuevoValorLimpio = newValue.trim().toUpperCase(); 
    const docId = aggregatedRows[rowIndex]._id;
    const filasDelMismoDoc = aggregatedRows.filter(fila => fila._id === docId);
    //Verificar duplicados 
    const esDuplicado = filasDelMismoDoc.some((fila, index) => {
      const campoExistenteLimpio = (fila.campo || '').trim().toUpperCase();
      return index !== rowIndex && campoExistenteLimpio === nuevoValorLimpio;
    });

    if (esDuplicado) {
      Swal.fire({
        title:"Error", 
        text: `La pieza "${nuevoValorLimpio}" ya existe en este modelo. Por favor, usa un nombre diferente.`, 
        icon: "warning",
        background: '#052b27ff',
        color: '#ffdfdfff',
        confirmButtonColor: '#0b6860ff',
      });
      return; 
    }

    setAggregatedRows(prevRows => {
      const newRows = [...prevRows];
      newRows[rowIndex].campo = newValue;
      return newRows;
    });
  };

  const eliminarFilaAgregada = async (rowIndex) => {
    const fila = aggregatedRows[rowIndex];
    if (!fila) return;

    const result = await Swal.fire({
      title: '¿Eliminar pieza?',
      text: `¿Deseas eliminar la pieza "${fila.campo || fila.codigo || ''}" de la lista?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#07433E',
      cancelButtonColor: 'rgba(197, 81, 35, 1)',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#052b27ff',
      color: '#ffdfdfff',
    });

    if (result.isConfirmed) {
      setAggregatedRows(prev => prev.filter((_, i) => i !== rowIndex));
    }
  };

  return (
    <div className="page-offset bg-gradient2 bg-generador">
      <NavBar/>
      <div>
        <div className="generador-container">
          <h2>Ingresa Celular</h2>
          <div className="generador-form">
            <div className="search-row" style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Buscar celular (ej: pantalla, moto g7, XT1962-4)"
                value={searchQuery}
                onFocus={() => { fetchRemoteTablas(); updateSuggestions(searchQuery); }}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchQuery(v);
                  if (!v || v.toString().trim() === '') {
                    setAggregatedMode(false);
                    setShowResults(false);
                    setTableGenerated(false);
                    return;
                  }

                  if (remoteTablas.length === 0 && !remoteLoading) fetchRemoteTablas();
                  updateSuggestions(v);
                  setTableGenerated(false);
                  setShowResults(true);
                }}
                onBlur={() => setTimeout(() => 200)}
                className="search-input"
              />
              <button className="btn btn-danger volver-btn" onClick={()=> navigate(-1)} style={{ marginLeft: 8 }}>Volver</button>
            </div>
          </div>
          {showResults && (
            <>
              {/** Sección para crear un nuevo celular y sus piezas **/}
              {tableGenerated && (aggregatedMode ? aggregatedRows.length > 0 : tabla.filter((f) => matchesQuery(f)).length > 0) && (
                <div className="generador-actions">
                  {modoEdicionLocal && (
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
                  <button className={`btn ${modoEdicionLocal ? 'cancelar-btn' : 'btn-gold'}`}  onClick={() => { setModoEdicionLocal(!modoEdicionLocal); setAggregatedMode(false); }}>{modoEdicionLocal ? 'Cancelar' : 'Editar'}</button>
                  <div  className='select-marca' style={{ marginLeft: 12}}>
                    <div>
                      <label style={{ marginRight: 8 }}>Marca:</label>
                      <select
                        value={marca}
                        onChange={(e) => {
                          const nuevaMarca = e.target.value;
                          if (nuevaMarca === 'Otros') {
                            setMostrarModal(true);
                            //setMarca(''); 
                          } else {
                            setMarca(nuevaMarca);
                          }
                        }}
                        className="brand-select"
                      >
                        <option value="">-- Selecciona marca --</option>
                        {marcasDisponibles.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <Modal show={mostrarModal} onHide={() => {
                      setMostrarModal(false); 
                      setNuevaMarcaInput('');
                      setMarca(''); 
                      }}
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>Agregar Nueva Marca</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <Form>
                          <Form.Group className="mb-3">
                            <Form.Label>Nombre de la nueva marca:</Form.Label>
                            <input
                              type="text"
                              value={nuevaMarcaInput}
                              className='tabla-edicion-input'
                              onChange={(e) => setNuevaMarcaInput(e.target.value)}
                              placeholder="Ej: Google Pixel"
                            />
                          </Form.Group>
                        </Form>
                      </Modal.Body>
                      <Modal.Footer>
                        {/* Botón Cancelar */}
                        <Button variant="secondary" onClick={() => {
                            setMostrarModal(false); 
                            setNuevaMarcaInput('');
                            setMarca('');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleAgregarMarca}>
                          Guardar y Seleccionar
                        </Button>
                      </Modal.Footer>
                    </Modal>
                  </div>
                  <button onClick={() => { guardarTabla(); setAggregatedMode(false); }}>Guardar</button>
                </div>
              )}

              {/** Sección para el resultado de la busqueda de tablas existentes y edición **/}
              { (() => {
                if (aggregatedMode) {
                  const rowsAgg = aggregatedRows;
                  if (!rowsAgg.length) {
                    return (
                      <div style={{ padding: 20, textAlign: 'center' }}>
                        No se encontraron resultados para la búsqueda.
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className='generador-actions'>
                        {modoEdicionAgregada && (
                          <>
                            {/* botón nueva pieza */}
                            <button 
                              className="btn btn-nuevo" 
                              onClick={agregarFila}
                            >
                              <FaPlus className="plus-new"/>Añadir Pieza a este Celular
                            </button>
                          </>
                        )}
                        {modoEdicionAgregada && (
                          <button 
                            className="btn btn-success" 
                            onClick={guardarCambiosAgregados}
                            style={{ marginLeft: '8px' }}
                          >
                            Guardar Cambios
                          </button>
                        )}
                        <button 
                          className={`btn ${modoEdicionAgregada ? 'cancelar-btn' : 'btn-gold'}`} 
                          onClick={() => { 
                            if (modoEdicionAgregada) {
                              updateSuggestions(searchQuery); 
                            }
                            setModoEdicionAgregada(!modoEdicionAgregada); 
                          }}
                        >
                          {modoEdicionAgregada ? 'Cancelar Edición' : 'Editar Tabla'}
                        </button>
                      </div>

                      <table className="tabla-auxiliares">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>Modelo</th>
                            <th>Marca</th>
                            <th>Pieza</th>
                            <th>Código</th>
                            <th>Código compatibilidad</th>
                            {modoEdicionAgregada && <th>Acciones</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {rowsAgg.map((fila, index) => (
                            <tr key={`${fila._id || 'r'}-${index}`}>
                              <td>{fila.nombre}</td>
                              <td>{fila.modelo}</td>
                              <td>{fila.marca}</td>
                              <td>{modoEdicionAgregada && fila.isNew ? (
                                  <input
                                    type="text"
                                    className='tabla-edicion-input'
                                    value={fila.campo || ''}
                                    onChange={(e) => editarCampoAgregado(index, e.target.value)}
                                  />
                                ) : (fila.campo)}
                              </td>
                              <td>{fila.codigo}</td>
                              <td>{modoEdicionAgregada ? (
                                  <input
                                    type="text"
                                    className='tabla-edicion-input'
                                    value={fila.codigoCompatibilidad|| ''}
                                    onChange={(e) => editarCompatibilidadAgregada(index, e.target.value)}
                                  />
                                ) : (fila.codigoCompatibilidad || '')}
                              </td>
                              {modoEdicionAgregada && (
                                <td>
                                  <button className="btn btn-sm btn-danger" onClick={() => eliminarFilaAgregada(index)} title="Eliminar fila">
                                    <img 
                                      src={IconoEliminar} 
                                      alt="btn-eliminar"
                                      width="30px"
                                      height="30px"
                                    />
                                  </button>
                                </td>
                              )}
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
                    <div style={{ padding: 20, textAlign: 'center'}}>
                      <div>No se encontraron resultados.</div>
                      <div style={{ marginTop: 12 }}>
                        <label style={{ display: 'block', marginBottom: 6 }}>Ingrese el modelo del celular para crear uno nuevo:</label>
                        <div style={{ display:'flex', justifyContent:'center'}}>
                          <input
                          type="text"
                          name="nuevoModelo"
                          placeholder="Ej: XT1962-4 (Modelo del celular)"
                          value={nuevoModeloInput}
                          onChange={(e) => setNuevoModeloInput(e.target.value)}
                          className="small-input"
                          />
                          <button
                            className="btn btn-generar"
                            style={{ marginLeft: 8 }}
                            onClick={() => generarTablaConModeloManual(nuevoModeloInput)}
                          >
                            Crear nuevo celular
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <table className="tabla-auxiliares">
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
                          <td>{modoEdicionLocal ? (
                              <input
                                type="text"
                                className='tabla-edicion-input'
                                value={fila.campo}
                                onChange={(e) => editarCampo(index, e.target.value)}
                              />
                            ) : (fila.campo)}
                          </td>
                          <td>{modoEdicionLocal ? (
                              <input
                                type="text"
                                className='tabla-edicion-input'
                                value={fila.codigo}
                                onChange={(e) => editarCodigo(index, e.target.value)}
                              />
                            ) : (fila.codigo)}
                          </td>
                          <td>{modoEdicionLocal ? (
                              <input
                                type="text"
                                className='tabla-edicion-input'
                                value={fila.codigoCompatibilidad || ''}
                                onChange={(e) => editarCompatibilidad(index, e.target.value)}
                              />
                            ) : (fila.codigoCompatibilidad || '')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneradorTabla;