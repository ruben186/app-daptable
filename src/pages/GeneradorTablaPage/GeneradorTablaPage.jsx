import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore'; 
import { Modal, Button, Form } from 'react-bootstrap';
import { db } from '../../firebase'; // Asegúrate de que esta ruta sea correcta
import './GeneradorTablaPage.css';
import NavBar from '../components/NavBarPage';
import Swal from 'sweetalert2';
import { FaPlus } from 'react-icons/fa';
import IconoEliminar from '../../assets/Iconos/iconoEliminar.png';

const GeneradorTabla = () => {
  const [nombre, setNombre] = useState('');
  const [modelo, setModelo] = useState('');
  const [marca, setMarca] = useState(''); // Estado para la marca
  const [searchQuery, setSearchQuery] = useState('');
  const [tabla, setTabla] = useState([]);
  const [modoEdicionLocal, setModoEdicionLocal] = useState(false);
  const [modoEdicionAgregada, setModoEdicionAgregada] = useState(false);
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
  const [marcasDisponibles, setMarcasDisponibles] = useState(['Otros']);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevaMarcaInput, setNuevaMarcaInput] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchMarcasUnicas = async () => {
      try {
        //Referencia a la colección donde guardas tus productos/celulares
        const coleccionRef = collection(db, 'tablas'); 
        
        // Obtener todos los documentos
        const snapshot = await getDocs(coleccionRef);
        
        // Usar un Set para deduplicar los nombres de marca
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
        // Convertir el Set de vuelta a Array y añadir 'Otros'
        const listaMarcas = [...Array.from(marcasSet), 'Otros'];

        // Actualizar el estado con la lista sin repeticiones
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

          setShowSuggestions(false);
        }

      } catch (error) {
        console.error("Error al obtener las marcas de Firebase: ", error);
        setMarcasDisponibles(['Error de carga', 'Otros']);
      }
    };

    fetchMarcasUnicas();
  }, [location.search, remoteTablas.length]); // El array vacío asegura que

  // Manejador para cuando cambia la selección en el <select>
  const handleChange = (e) => {
    const nuevaSeleccion = e.target.value;
    
    // Si la selección es "Otros", abrimos el modal
    if (nuevaSeleccion === 'Otros') {
      setMostrarModal(true);
      // Mantenemos la marcaSeleccionada en su valor anterior hasta que se ingrese la nueva
    } else {
      setMarcaSeleccionada(nuevaSeleccion);
    }
  };


  // Manejador para agregar la nueva marca
  const handleAgregarMarca = () => {
    // Validar que el campo no esté vacío
    if (!nuevaMarcaInput.trim()) {
      alert("Por favor, ingresa un nombre de marca válido.");
      return;
    }

    // 1. Agregar la nueva marca a la lista
    // Usamos el spread operator para mantener las marcas existentes y añadir la nueva
    const nuevaMarcaNormalizada = nuevaMarcaInput.trim();
    
    // Verificamos que no se esté agregando una marca duplicada 
    if (marcasDisponibles.includes(nuevaMarcaNormalizada)) {
        alert("Esa marca ya existe en la lista.");
        setNuevaMarcaInput('');
        setMostrarModal(false);
        setMarcaSeleccionada(nuevaMarcaNormalizada);
        return;
    }
      
    // Creamos la nueva lista incluyendo la nueva marca, pero SIN la opción "Otros"
    // y luego la re-agregamos al final para que siempre esté disponible.
    const listaSinOtros = marcasDisponibles.filter(m => m !== 'Otros');
    const nuevaListaMarcas = [...listaSinOtros, nuevaMarcaNormalizada, 'Otros'];
    
    setMarcasDisponibles(nuevaListaMarcas);

    // Establecer la nueva marca como la seleccionada actualmente
    setMarca(nuevaMarcaNormalizada);

    // Limpiar y cerrar
    setNuevaMarcaInput('');
    setMostrarModal(false);
    
  };

  

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
    const nombreParsed = q;
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
    setModoEdicionLocal(false);
    setTableGenerated(true);
    setShowResults(true);
    setModoEdicionAgregada(false);
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
    'FLEX DE CARGA',
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
    
    // ⬅️ PASO CLAVE 1: Dividir la consulta normalizada en términos
    const qlTerms = qlNorm.split(' ').filter(term => term.length > 0);

    if (qlTerms.length === 0) { // Usamos qlTerms para la verificación de vacío
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    const found = [];
    const agg = [];
    remoteTablas.forEach((d) => {
    // sugerencias: añadir hasta 6 documentos que coincidan
      if (found.length < 6) {
        const docText = (extractText(d) + ' ' + (d._id || '')).toString().toLowerCase();
        const allTermsMatch = qlTerms.every(term => docText.includes(term));

        if (allTermsMatch) { // ⬅️ Usamos la nueva verificación
          found.push(d);
        }
      }

    // filas agregadas: para cada campo en el documento, si el texto combinado de la fila coincide, añadir a agg
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
        
        // ⬅️ PASO CLAVE 2B: Aplicar la misma lógica a las filas agregadas
        const allRowTermsMatch = qlTerms.every(term => rowText.includes(term));

        if (allRowTermsMatch) { // ⬅️ Usamos la nueva verificación
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

  const volver = () => {
    navigate(-1);
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

    Swal.fire({
      title:"¡Celular Guardado!", 
      text: `Celular guardado correctamente en Firebase con ID: ${docId}.`, 
      icon: "success",
      background: '#052b27ff', // Color de fondo personalizado
      color: '#ffffffff', // Color del texto personalizado
      confirmButtonColor: '#0b6860ff',
    })

    // 5. LIMPIAR TODOS LOS ESTADOS para una nueva tarea
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
    // 1. Agrupar las filas editadas por su ID de documento (_id)
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
            codigoCompatibilidad: fila.codigoCompatibilidad, // El valor potencialmente editado
        });
        return acc;
    }, {});

    try {
        const docIdsModificados = Object.keys(cambiosPorDoc);
        
        // 2. Iterar sobre los documentos modificados y guardarlos
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

        // 3. Opcional: Salir del modo edición después de guardar
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

  const agregarFilaAgregada = () => {
    // 1. Verificar si estamos en modo edición y si hay filas para usar como base
    if (!modoEdicionAgregada || aggregatedRows.length === 0) {
        alert("Primero debes entrar en modo edición y tener resultados de búsqueda.");
        return;
    }

    // 2. Usar la primera fila como plantilla para los metadatos globales
    const baseFila = aggregatedRows[0];
    const docId = baseFila._id;

    // 3. Contar los campos existentes para este documento específico
    const camposExistentes = aggregatedRows.filter(fila => fila._id === docId);
    const nuevoIndice = camposExistentes.length + 1; 

    // 4. Generar el nuevo código 
    const nombreForCode = (baseFila.nombre || '').toString().trim().toUpperCase();
    const modeloForCode = (baseFila.modelo || '').toString().trim();
    const nuevoCodigo = `${nombreForCode}-${modeloForCode}-${nuevoIndice}`;

    // 5. Crear la nueva fila
    const nuevaFila = {
        _id: docId, // Crucial: mantiene el vínculo al documento
        nombre: baseFila.nombre,
        modelo: baseFila.modelo,
        marca: baseFila.marca,
        campo: `Pieza ${nuevoIndice}`, // Nombre de campo por defecto
        codigo: nuevoCodigo, // Código recién generado
        codigoCompatibilidad: '',
        // Bandera opcional para identificar que esta fila es nueva
        isNew: true, 
    };

    // 6. Actualizar el estado con la nueva fila
    setAggregatedRows(prevRows => [...prevRows, nuevaFila]);
};
const editarCampoAgregado = (rowIndex, newValue) => {
    const nuevoValorLimpio = newValue.trim().toUpperCase(); // Normalizar para la comparación
    
    // 1. Identificar el documento al que pertenece la fila actual
    const docId = aggregatedRows[rowIndex]._id;

    // 2. Filtrar las filas que pertenecen a este mismo documento
    const filasDelMismoDoc = aggregatedRows.filter(fila => fila._id === docId);

    // 3. Verificar duplicados 
    const esDuplicado = filasDelMismoDoc.some((fila, index) => {
        const campoExistenteLimpio = (fila.campo || '').trim().toUpperCase();
        return index !== rowIndex && campoExistenteLimpio === nuevoValorLimpio;
    });

    // 4. Si es duplicado, notificar y NO actualizar el estado
    if (esDuplicado) {
        Swal.fire({
          title:"Error", 
          text: `La pieza "${nuevoValorLimpio}" ya existe en este modelo. Por favor, usa un nombre diferente.`, 
          icon: "warning",
          background: '#052b27ff', // Color de fondo personalizado
          color: '#ffdfdfff', // Color del texto personalizado
          confirmButtonColor: '#0b6860ff',
        });
        return; 
    }

    // 5. Si es único, procedemos a actualizar el estado
    setAggregatedRows(prevRows => {
        const newRows = [...prevRows];
        newRows[rowIndex].campo = newValue; // Guardamos el valor tal cual lo ingresó (con mayúsculas/minúsculas)
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
    <div className="page-offset bg-gradient2">
      <NavBar/>
      <div>
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
              {/* Para cometarizar lineas seleccionadas se usa Shift + Alt + A
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
              )} */}
              <button className="btn btn-danger volver-btn" onClick={volver} style={{ marginLeft: 8 }}>Volver</button>
        </div>
          </div>

          {showResults && (
            <>
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
                              // Lógica para abrir modal y resetear la selección (opcional)
                              setMostrarModal(true);
                              //setMarca(''); 
                          } else {
                              // Lógica normal
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
                  // Función de cancelación completa
                  setMostrarModal(false); 
                  setNuevaMarcaInput('');
                  // setMarcaSeleccionada(''); 
                  setMarca(''); 
                  }}>
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
                              // setMarcaSeleccionada(''); // Si aplica
                              setMarca('');
                          }}>
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

              {/** Compute displayed rows applying search and marca filter **/}
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
                                onClick={agregarFilaAgregada}
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
                              ) : (
                                  // Si no es nueva o no está en modo edición, se muestra solo el texto
                                  fila.campo
                              )}</td>

                              <td>{fila.codigo}</td>

                              <td>{
                              modoEdicionAgregada ? (
                                <input
                                  type="text"
                                  className='tabla-edicion-input'
                                  value={fila.codigoCompatibilidad|| ''}
                                  onChange={(e) => editarCompatibilidadAgregada(index, e.target.value)}
                                />
                              ) 
                                : (fila.codigoCompatibilidad || '')
                              
                                }</td>
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
                        
                        >Crear nuevo celular</button>
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
                          <td>
                            {modoEdicionLocal ? (
                              <input
                                type="text"
                                className='tabla-edicion-input'
                                value={fila.campo}
                                onChange={(e) => editarCampo(index, e.target.value)}
                              />
                            ) : (
                              fila.campo
                            )}
                          </td>
                          <td>
                            {modoEdicionLocal ? (
                              <input
                                type="text"
                                className='tabla-edicion-input'
                                value={fila.codigo}
                                onChange={(e) => editarCodigo(index, e.target.value)}
                              />
                            ) : (
                              fila.codigo
                            )}
                          </td>
                          <td>
                            {modoEdicionLocal ? (
                              <input
                                type="text"
                                className='tabla-edicion-input'
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
      
    </div>
  );
};

export default GeneradorTabla;