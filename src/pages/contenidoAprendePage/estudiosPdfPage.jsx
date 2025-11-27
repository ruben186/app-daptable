import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import { Card, Button } from 'react-bootstrap';
import './contenidoAprendePage.css';

const EstudiosPdfPage = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPdfs = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'estudios'), where('tipo', '==', 'pdf'), orderBy('creadoEn', 'desc'));
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPdfs(items);
      } catch (err) {
        console.error('Error cargando pdfs:', err);
        setPdfs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPdfs();
  }, []);

  return (
    <>
      <NavBar />
      <main className="container py-4">
        <h2>Material de Estudio - PDFs</h2>
        {loading && <p>Cargando...</p>}
        <div className="row">
          {pdfs.map(p => (
            <div className="col-md-6" key={p.id}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>{p.nombre}</Card.Title>
                  <Card.Text>{p.descripcion}</Card.Text>
                  {p.url && (
                    <div className="mb-2">
                      <a href={p.url} target="_blank" rel="noreferrer">Abrir PDF</a>
                    </div>
                  )}
                  <div className="d-flex justify-content-between">
                    {p.url && <Button variant="primary" onClick={() => window.open(p.url, '_blank')}>Ver / Descargar</Button>}
                    <small className="text-muted">{p.creadoEn?.toDate ? new Date(p.creadoEn.toDate()).toLocaleString() : ''}</small>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
          {pdfs.length === 0 && !loading && <p>No hay PDFs disponibles.</p>}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default EstudiosPdfPage;
