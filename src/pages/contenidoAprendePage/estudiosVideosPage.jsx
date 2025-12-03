import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import { Card, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';


const EstudiosVideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const [filteredVideos, setFilteredVideos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'estudios'), where('tipo', '==', 'video'));
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setVideos(items);
        setFilteredVideos(items);
      } catch (err) {
        console.error('Error cargando videos:', err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  useEffect(() => {
    const ps = new URLSearchParams(location.search);
    const currentSearchTerm = ps.get('q')?.toLowerCase() || ''; // Definición local para el useEffect

     if (currentSearchTerm && videos.length > 0) {
       // Filtrar por nombre o descripción
       const results = videos.filter(video => 
         video.nombre?.toLowerCase().includes(currentSearchTerm) || 
         video.descripcion?.toLowerCase().includes(currentSearchTerm)
       );
       setFilteredVideos(results);
     } else {
       // Si no hay término de búsqueda, mostrar todos los videos cargados
       setFilteredVideos(videos);
     }

   }, [location.search, videos]); 
   // Definición del término de búsqueda para el renderizado (mensajes)
   const ps = new URLSearchParams(location.search);
   const searchTerm = ps.get('q') || '';

  const renderPreview = (url) => {
    if (!url) return null;
    try {
      if (/youtube\.com|youtu\.be/.test(url)) {
        let embed = url;
        if (url.includes('watch?v=')) embed = url.replace('watch?v=', 'embed/');
        embed = embed.replace('youtu.be/', 'www.youtube.com/embed/');
        return (
          <div className="ratio ratio-16x9 mb-2">
            <iframe src={embed} title="video" allowFullScreen />
          </div>
        );
      }
      return (
        <video controls className="w-100 mb-2">
          <source src={url} />
        </video>
      );
    } catch (e) { return null; }
  };

  const goToDetalle = (item) => {
    if (!item || !item.id) return;
    navigate(`/aprende/video/${item.id}`);
  };

  const DataCard = ({ item }) => {
    const fecha = item.fecha?.toDate ? new Date(item.fecha.toDate()).toLocaleString() : (item.fecha ? String(item.fecha) : '');
    // Extraer posible thumbnail de YouTube (si es youtube) para mostrar en el área superior
    let thumbnail = null;
    try {
      const m = item.url && item.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_\-]+)/);
      if (m && m[1]) thumbnail = `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
    } catch (e) { /* ignore */ }

    return (
      <div className="custom-datacard" onClick={() => goToDetalle(item)} style={{ cursor: 'pointer' }}>
        <div className="datacard-thumb" style={{
          height: 220,
          borderRadius: '12px 12px 0 0',
          backgroundColor: '#061014',
          backgroundImage: thumbnail ? `url(${thumbnail})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
        <div className="datacard-bottom" style={{
          backgroundColor: '#064e49',
          padding: '22px',
          borderRadius: '0 0 12px 12px',
        }}>
          <div style={{ textAlign: 'center', color: '#3BD5C4' }}>
            <h5 style={{ margin: 0 }}>{item.nombre}</h5>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <NavBar />
      <main className="containerVideo container py-4">
        {loading && <p>Cargando...</p>}
        <div className="row">
          {filteredVideos.length > 0 ? (
            filteredVideos.map(v => (
              <div className="col-12 col-sm-6 col-md-4 mb-3" key={v.id}>
                <DataCard item={v} />
              </div>
            ))
          ) : (
           !loading && (searchTerm ? <p>No se encontraron videos para "{searchTerm}".</p> : <p>No hay videos disponibles.</p>)
          )}
        </div>
      </main>
      <Footer />
    </>
  );

};

export default EstudiosVideosPage;
