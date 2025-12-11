import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './opinionPage.css'; 
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import IconoMala from '../../assets/Iconos/ExperienciaMala.png';
import IconoBuena from '../../assets/Iconos/ExperienciaBuena.png';
import IconoExcelente from '../../assets/Iconos/ExperienciaExcelente.png';

const OpinionPage = () => {
  // Estado para la opción seleccionada ('MALA', 'BUENA', 'EXCELENTE')
  const [opinion, setOpinion] = useState('');
  // Estado para el texto de justificación
  const [justification, setJustification] = useState('');
  // Estado para manejar el estado de la carga o errores
  const [statusMessage, setStatusMessage] = useState('');
  // Función para manejar la selección de la opción
  const handleOpinionSelect = (selectedOpinion) => {
    setOpinion(selectedOpinion);
  };

  // Función para enviar los datos a Firebase
  const handleSubmit = async () => {
    if (!opinion) {
      setStatusMessage('Por favor, selecciona una opción.');
      return;
    }

    setStatusMessage('Enviando...');

    try {
      // Referencia a la colección 'experiencia'
      const usuariosCollectionRef = collection(db, 'experiencia');
      await addDoc(usuariosCollectionRef, {
        opinion: opinion, // 'MALA', 'BUENA' o 'EXCELENTE'
        justificacion: justification,
        fecha: new Date(),
      });

      setStatusMessage('¡Gracias! Tu opinión ha sido enviada con éxito.');
      setOpinion(''); 
      setJustification('');
    } catch (error) {
      console.error('Error al añadir el documento: ', error);
      setStatusMessage('Error al enviar la opinión. Inténtalo de nuevo.');
    }
  };

  return (
    <>
      <NavBar />
      <div className='bg-gradient2'>
        <div className="opinion-container">
          <header className="opinion-header">
            <h2>¿Cómo fue tu experiencia?</h2>
          </header>

          <div className="options-grid">
            {/* Opción MALA */}
            <div 
              className={`option-card ${opinion === 'MALA' ? 'selected' : ''}`}
              onClick={() => handleOpinionSelect('MALA')}
            >
              < img src={IconoMala} loading="lazy"  alt="Mala experiencia" />
            </div>

            {/* Opción BUENA */}
            <div 
              className={`option-card ${opinion === 'BUENA' ? 'selected' : ''}`}
              onClick={() => handleOpinionSelect('BUENA')}
            >
              < img src={IconoBuena} loading="lazy" alt="Buena experiencia" />
            </div>

            {/* Opción EXCELENTE */}
            <div 
              className={`option-card ${opinion === 'EXCELENTE' ? 'selected' : ''}`}
              onClick={() => handleOpinionSelect('EXCELENTE')}
            >
              < img src={IconoExcelente} loading="lazy" alt="Excelente experiencia" />
            </div>
          </div>

          {/* --- Campo de Justificación --- */}     
          <div className="justification-section ">
            <textarea
              id="justification-input"
              className='form-control2 textarea-comentarios'
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Porque?"
              rows="4"
            />
          </div>

          {/* --- Botón y Mensaje de Estado --- */}
          <div className="d-grid gap-2">
            <button 
            className="btn-primary submit-button" 
            onClick={handleSubmit} 
            disabled={!opinion || statusMessage === 'Enviando...'}
            >
              Enviar
            </button>
          </div>
          {statusMessage && <p className="status-message">{statusMessage}</p>}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OpinionPage;