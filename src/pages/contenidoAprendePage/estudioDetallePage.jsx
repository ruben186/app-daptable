import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import { Button } from 'react-bootstrap';
import './contenidoAprendePage.css';

const EstudioDetallePage = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const ref = doc(db, 'estudios', id);
        const snap = await getDoc(ref);
        if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
        else setItem(null);
      } catch (e) {
        console.error('Error cargando detalle:', e);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const renderVideo = (url) => {
    if (!url) return null;
    if (/youtube\.com|youtu\.be/.test(url)) {
      let embed = url;
      if (embed.includes('watch?v=')) embed = embed.replace('watch?v=', 'embed/');
      embed = embed.replace('youtu.be/', 'www.youtube.com/embed/');
      return (
        <div className="ratio ratio-16x9">
          <iframe src={embed} title={item?.nombre} allowFullScreen style={{ width: '100%', height: '100%', border: 0 }} />
        </div>
      );
    }
    return (
      <video controls className="w-100">
        <source src={url} />
      </video>
    );
  };

  return (
    <>
      <NavBar />
      <button type="button" className="btn-outline-volver" onClick={() => navigate(-1)}>
            &lt; Volver
      </button>
      <main className="container containerVideo2 ">
          
        {loading && <p>Cargando...</p>}
        {!loading && !item && <p>Material no encontrado.</p>}
        {item && (
          <div>
            <h2>{item.nombre}</h2>
            <div className="mb-3" style={{ margin: '0 auto', border: '8px solid #09665E' }}>{renderVideo(item.url)}</div>
            <strong>Descripción:</strong><br /><textarea width className='descripcion-video' disabled>{item.descripcion}</textarea>
            <p> {item.fecha?.toDate ? new Date(item.fecha.toDate()).toLocaleString() : ''}</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default EstudioDetallePage;
