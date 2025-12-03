import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Container, Table, Button, Modal, Form, InputGroup, ProgressBar } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaUserCircle, FaPlus, FaSearch } from 'react-icons/fa';
import { db } from '../../firebase';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import IconoNoticia from '../../assets/Iconos/iconograbadora.png';
import IconoEditar from '../../assets/Iconos/iconoEditar.png';
import IconoEliminar from '../../assets/Iconos/iconoEliminar.png';
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';

function GestionNoticiasPage() {
  const navigate = useNavigate();
  const [noticia, setNoticia] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const NODE_SERVER_URL = 'http://localhost:3001/api/upload-pdf';

  // Modal para edición/visualización
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const [tempFile, setTempFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'materialNoticias'));
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setNoticia(rows);
        setFiltered(rows);
      } catch (err) {
        console.error('Error fetching estudios:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);
  

  useEffect(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    if (!q) {
      setFiltered(noticia);
      return;
    }
    const parts = q.split(/\s+/).filter(Boolean);
    const results = noticia.filter(item => {
      const text = `${item.nombre || ''} ${item.descripcion || '' } ${item.tipo || '' }`.toLowerCase();
      return parts.every(p => text.includes(p));
    });
    setFiltered(results);
  }, [searchTerm, noticia]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás Seguro?',
      text: 'Eliminarás este Material de Estudio',
      icon: 'warning',
      showCancelButton: true,
      background: '#052b27ff',
      color: '#ffdfdfff',
      confirmButtonColor: '#07433E',
      cancelButtonColor: 'rgba(197, 81, 35, 1)',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;
    try {
      await deleteDoc(doc(db, 'estudios', id));
      setNoticia(prev => prev.filter(p => p.id !== id));
      setFiltered(prev => prev.filter(p => p.id !== id));
      Swal.fire({ title:"Eliminado", text: "Material de estudio eliminado correctamente", icon: "success", background: '#052b27ff', color: '#ffffffff', confirmButtonColor: '#0b6860ff'});
    } catch (err) {
      console.error(err);
      Swal.fire({ title:"Error", text: "No se pudo eliminar el registro", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff'});
    }
  };
  const handleCloseModal = () => {
     setShowModal(false);
     setTempFile(null);
     setUploadProgress(0);
     setUploading(false);
   };
  const handleOpenModal = async (item) => {
    setTempFile(null); // Asegura que no haya un archivo pendiente de una sesión anterior
    setUploadProgress(0); 
    setUploading(false);
    // Cargar documento actualizado por si hubo cambios
    try {
      const docRef = doc(db, 'materialNoticias', item.id);
      const snap = await getDoc(docRef);
      const data = snap.exists() ? { id: snap.id, ...snap.data() } : item;
      setSelected(data);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      setSelected(item);
      setShowModal(true);
    }
  };

  const handleTempFileChange = (e) => {
     const f = e.target.files && e.target.files[0];
     if (f && f.type === 'application/pdf') {
       setTempFile(f);
       setUploadProgress(0);
     } else {
       setTempFile(null);
       if (f) {
         Swal.fire({ title: "Formato inválido", text: "Solo se permiten archivos PDF.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff' });
       }
     }
  };

  const handleSave = async () => {
    if (!selected || !selected.id) return;
     if (!selected.nombre || !selected.descripcion || !selected.url) {
      Swal.fire({ title:"Campos incompletos", text: "Todos los campos deben ser llenados.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff' });
      return;
    }   
     let downloadURL = selected.url;    
     // 1. Subida del PDF (Solo si es PDF y se seleccionó un nuevo archivo)
     if (selected.tipo === 'pdf' && tempFile) {
       setUploading(true);
       setUploadProgress(10);
       try {
         const formData = new FormData();
         formData.append('archivo', tempFile); 
         
         if (selected.url) {
           formData.append('oldFileUrl', selected.url);
          }

         const response = await fetch(NODE_SERVER_URL, {
           method: 'POST',
           body: formData,
         });

         setUploadProgress(50); 
         const data = await response.json();    
         if (!response.ok || !data.success || !data.url) {
           throw new Error(data.message || "Error al subir el nuevo PDF.");
         }
         downloadURL = data.url; // Nueva URL del archivo subido
         setUploadProgress(90);
       } catch (error) {
         console.error("Error al subir PDF:", error);
         setUploading(false);
         setUploadProgress(0);
         Swal.fire({ title: "Error de Subida", text: "No se pudo subir el nuevo PDF.", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff' });
         return; // Detiene el proceso si falla la subida
       }
     }
    try {
      const ref = doc(db, 'materialNoticias', selected.id);
      const payload = {
        nombre: selected.nombre || '',
        descripcion: selected.descripcion || '',
        tipo: selected.tipo || '',
        url: downloadURL || '',
        fecha: selected.fecha || ''
        
      };
      await updateDoc(ref, payload);
      setNoticia(prev => prev.map(e => e.id === selected.id ? { ...e, ...payload } : e));
      setFiltered(prev => prev.map(e => e.id === selected.id ? { ...e, ...payload } : e));
      setUploadProgress(100);
      setUploading(false);
      handleCloseModal();

     
      Swal.fire({ title:"Guardado", text: "Cambios guardados correctamente", icon: "success", background: '#052b27ff', color: '#ffffffff', confirmButtonColor: '#0b6860ff'});
    } catch (err) {
      console.error(err);
      setUploading(false);
      setUploadProgress(0);
      Swal.fire({ title:"Error", text: "No se pudieron guardar los cambios", icon: "error", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff'});
    }
  };

  const exportToCSV = (rows) => {
    if (!rows || rows.length === 0) {
      Swal.fire({ title:"Info", text: "No hay filas para exportar", icon: "info", background: '#052b27ff', color: '#ffdfdfff', confirmButtonColor: '#0b6860ff'});
      return;
    }
    const headers = ['Nombre', 'Descripción', 'Tipo', 'Fecha', 'URL'];
    const lines = [headers.join(';')];
    rows.forEach(r => {
      const safe = s => `"${(s || '').toString().replace(/"/g, '""')}"`;
      lines.push([safe(r.nombre), safe(r.descripcion), safe(r.tipo), safe(r.fecha), safe(r.url)].join(';'));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noticias_export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <NavBar />
      <main className="main-content-dashboard bg-gradient2">
        <Container className="mt-5">
          <div className="table-container">
            <div className="header-tabla">
              <div className="nombre-tabla">
                <img src={IconoNoticia} width="44px" height="44px" alt="Libro" />
                <h2>Material de Noticias</h2>
              </div>
               <div className="d-flex align-items-center">
                    <div className="count-info2">
                        <span className="count-number2">{filtered.length}</span> Noticias Registradas
                    </div>
                </div>
            </div>

            <div className="header-tabla2">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button variant="success" className="btn-nuevo" onClick={() => navigate('/nuevaNoticia')}>
                    <FaPlus className="plus-new" /> Nuevo
                </Button>
                <Button className="btn-success exportar-btn"  onClick={() => exportToCSV(filtered)}>Exportar CSV</Button>
                <button type="button" className="btn-volver" onClick={() => navigate(-1)}>
                    Volver
                </button>
              </div>

              <InputGroup className="search-input-group" style={{ maxWidth: 300 }}>
                <Form.Control
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)} 
                    className="search-buscar"
                />
                <img width="28px" height="28px" src={IconoBuscar} className='btn-icon-buscar' />
              </InputGroup>
            </div>

            <Table striped bordered hover responsive className="tabla-auxiliares ">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>URL</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td>{item.nombre}</td>
                    <td style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.descripcion}</td>
                    <td>{item.tipo || '-'}</td>
                    <td>{item.fecha.toDate().toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                      }) || '-'}
                    </td>
                    <td>{item.url ? <a className='login-invited-btn' href={item.url} target="_blank" rel="noreferrer">Enlace</a> : '-'}</td>
                    <td>
                      <Button variant="warning" size="sm" className="me-2" onClick={() => handleOpenModal(item)}>
                        <img src={IconoEditar} alt="editar" width="30" height="30" />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)}>
                        <img src={IconoEliminar} alt="eliminar" width="30" height="30" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Container>
      </main>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Material de Estudio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Nombre</Form.Label>
                <Form.Control value={selected.nombre || ''} onChange={(e) => setSelected(s => ({ ...s, nombre: e.target.value }))} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Descripción</Form.Label>
                <Form.Control as="textarea" rows={4} value={selected.descripcion || ''} onChange={(e) => setSelected(s => ({ ...s, descripcion: e.target.value }))} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Tipo</Form.Label>
                <Form.Select 
                   value={selected.tipo || 'video'} 
                   onChange={(e) => setSelected(s => ({ ...s, tipo: e.target.value, url: '' }))} // Limpiar URL si el tipo cambia
                   disabled={uploading} // No permitir cambiar si se está subiendo
                 >
                   <option value="video">Video</option>
                   <option value="pdf">PDF</option>
                 </Form.Select>
              </Form.Group>
                {selected.tipo === 'video' ? (
                  <Form.Group className="mb-2">
                    <Form.Label>Enlace del Video (URL)</Form.Label>
                    <Form.Control 
                      value={selected.url || ''} 
                      onChange={(e) => setSelected(s => ({ ...s, url: e.target.value }))} 
                      disabled={uploading}
                    />
                    {selected.url && (
                      <a className='login-invited-btn' href={selected.url} target="_blank" rel="noreferrer">Ver recurso</a>
                    )}
                  </Form.Group>
                 ) : (
                  <>
                    <Form.Group className="mb-2">
                      <Form.Label>Enlace del PDF (URL) </Form.Label>
                      <Form.Control type="text" name="url" value={selected.url || ''} onChange={(e) => setSelected(s => ({ ...s, url: e.target.value }))} />
                      {/* Mostrar enlace directo si existe */}
                      {selected.url && (
                          <a className='login-invited-btn' href={selected.url} target="_blank" rel="noreferrer">Ver recurso</a>
                      )}
                    </Form.Group>
                  
                    <Form.Group className="mb-2">
                    <Form.Label>Reemplazar PDF</Form.Label>
                    <Form.Control 
                      type="file" 
                      accept="application/pdf"
                      onChange={handleTempFileChange}
                      disabled={uploading}
                    />
                    {tempFile && <p className="text-info small mt-1">Archivo seleccionado: **{tempFile.name}**</p>}
                    {uploading && (
                     <div className="mt-2">
                       <ProgressBar className='bar-carga' now={uploadProgress} label={`${uploadProgress}%`} />
                     </div>
                    )}
                    </Form.Group>
                  </>
                )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={uploading}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={uploading}>Guardar</Button>
        </Modal.Footer>
      </Modal>

      <Footer />
    </>
  );
}

export default GestionNoticiasPage;
