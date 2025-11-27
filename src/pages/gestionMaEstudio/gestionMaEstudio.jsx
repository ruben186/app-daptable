import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Container, Table, Button, Modal, Form, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaUserCircle, FaPlus, FaSearch } from 'react-icons/fa';
import { db } from '../../firebase';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import IconoLibro from '../../assets/Iconos/iconoLibro.png';
import IconoEditar from '../../assets/Iconos/iconoEditar.png';
import IconoEliminar from '../../assets/Iconos/iconoEliminar.png';
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';

function GestionMaEstudioPage() {
  const navigate = useNavigate();
  const [estudios, setEstudios] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal para edición/visualización
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'estudios'));
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setEstudios(rows);
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
      setFiltered(estudios);
      return;
    }
    const parts = q.split(/\s+/).filter(Boolean);
    const results = estudios.filter(item => {
      const text = `${item.nombre || ''} ${item.descripcion || ''}`.toLowerCase();
      return parts.every(p => text.includes(p));
    });
    setFiltered(results);
  }, [searchTerm, estudios]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás Seguro?',
      text: 'Eliminarás este Material de Estudio',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#07433E',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteDoc(doc(db, 'estudios', id));
      setEstudios(prev => prev.filter(p => p.id !== id));
      setFiltered(prev => prev.filter(p => p.id !== id));
      Swal.fire('Eliminado', 'Registro eliminado correctamente', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo eliminar el registro', 'error');
    }
  };

  const handleOpenModal = async (item) => {
    // Cargar documento actualizado por si hubo cambios
    try {
      const docRef = doc(db, 'estudios', item.id);
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

  const handleSave = async () => {
    if (!selected || !selected.id) return;
    try {
      const ref = doc(db, 'estudios', selected.id);
      const payload = {
        nombre: selected.nombre || '',
        descripcion: selected.descripcion || '',
        fecha: selected.fecha || '',
        tipo: selected.tipo || '',
        url: selected.url || ''
        
      };
      await updateDoc(ref, payload);
      setEstudios(prev => prev.map(e => e.id === selected.id ? { ...e, ...payload } : e));
      setFiltered(prev => prev.map(e => e.id === selected.id ? { ...e, ...payload } : e));
      setShowModal(false);
      Swal.fire('Guardado', 'Cambios guardados correctamente', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
    }
  };

  const exportToCSV = (rows) => {
    if (!rows || rows.length === 0) {
      Swal.fire('Info', 'No hay filas para exportar', 'info');
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
    a.download = `estudios_export.csv`;
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
                <img src={IconoLibro} width="44px" height="44px" alt="Libro" />
                <h2>Material de Estudio</h2>
              </div>
               <div className="d-flex align-items-center">
                    <div className="count-info2">
                        <span className="count-number2">{filtered.length}</span> M.Estudios Registradas
                    </div>
                </div>
            </div>

            <div className="header-tabla2">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button variant="success" className="btn-nuevo" onClick={() => navigate('/nuevoEstudio')}>
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
                    <td>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">Enlace</a> : '-'}</td>
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
                <Form.Select value={selected.tipo || 'video'} onChange={(e) => setSelected(s => ({ ...s, tipo: e.target.value }))}>
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>URL</Form.Label>
                <Form.Control value={selected.url || ''} onChange={(e) => setSelected(s => ({ ...s, url: e.target.value }))} />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>Guardar</Button>
        </Modal.Footer>
      </Modal>

      <Footer />
    </>
  );
}

export default GestionMaEstudioPage;
