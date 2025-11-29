import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import { Card, Button} from 'react-bootstrap';
import './contenidoAprendePage.css';

const EstudiosPdfPage = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPdfs = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'estudios'), where('tipo', '==', 'pdf'));
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
      <main className="container  containerVideo py-4">
        {loading && <p>Cargando...</p>}
        <div className="row">
          {pdfs.map(p => (
            <div className="col-md-6" key={p.id}>
              <Card className="pdf-card shadow-lg mb-3">
                <Card.Body className="d-flex flex-column" >
                  <Card.Title className="pdf-card-title">{p.nombre}</Card.Title>
                  <textarea className="pdf-card-text flex-grow-1 descripcion-video" disabled>{p.descripcion}</textarea>
                  <hr/>
                  {p.url && ( 
                  <div className=" pt-2 ">
                    {p.url && 
                    <button 
                      onClick={() => window.open(p.url, '_blank')}
                      className=" btn btn-generar w-100"
                    >
                      Ver
                    </button>}
                    <div className="text-end mt-2">
                       <small className=" pdf-card-date">
                        {p.fecha?.toDate ? new Date(p.fecha.toDate()).toLocaleDateString('es-ES') : ''}
                       </small>
                     </div>
                  </div>
                  )}
                 
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
