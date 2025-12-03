import { useEffect, useState } from 'react';
import { collection, getDocs,query, where, addDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Table, Button, Card } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { db, auth } from '../../firebase';
import './opinionPage.css'; // <--- El CSS se carga aquí
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import { logActivity } from '../../firebase/historialService';
import { useAuthState } from 'react-firebase-hooks/auth';
import IconoMala from '../../assets/Iconos/ExperienciaMala.png';
import IconoBuena from '../../assets/Iconos/ExperienciaBuena.png';



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
      // Referencia a la colección 'usuarios'
      const usuariosCollectionRef = collection(db, 'usuarios');

      // Añadir un nuevo documento con la opinión y la justificación
      // Asumo que el campo en Firebase se llama 'opinion'
      await addDoc(usuariosCollectionRef, {
        opinion: opinion, // 'MALA', 'BUENA' o 'EXCELENTE'
        justificacion: justification,
        fecha: new Date(), // Para saber cuándo se envió
        // Puedes añadir aquí el ID del usuario si lo tienes disponible
        // userId: currentUser.uid, 
      });

      setStatusMessage('¡Gracias! Tu opinión ha sido enviada con éxito.');
      setOpinion(''); // Limpiar la selección
      setJustification(''); // Limpiar el campo de texto
    } catch (error) {
      console.error('Error al añadir el documento: ', error);
      setStatusMessage('Error al enviar la opinión. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="opinion-container">
      <header className="opinion-header">
        <button className="back-button">{'< Volver'}</button>
        <h2>¿Cómo fue tu experiencia?</h2>
      </header>

      {/* --- Opciones de Opinión --- */}
      <div className="options-grid">
        {/* Opción MALA */}
        <div 
          className={`option-card ${opinion === 'MALA' ? 'selected' : ''}`}
          onClick={() => handleOpinionSelect('MALA')}
        >
          {/* Aquí iría la imagen y texto de "MALA" */}
          <div className="icon-placeholder">😭</div>
          <span className="option-text mala">MALA</span>
        </div>

        {/* Opción BUENA */}
        <div 
          className={`option-card ${opinion === 'BUENA' ? 'selected' : ''}`}
          onClick={() => handleOpinionSelect('BUENA')}
        >
          {/* Aquí iría la imagen y texto de "BUENA" */}
          <div className="icon-placeholder">😊</div>
          <span className="option-text buena">BUENA</span>
        </div>

        {/* Opción EXCELENTE */}
        <div 
          className={`option-card ${opinion === 'EXCELENTE' ? 'selected' : ''}`}
          onClick={() => handleOpinionSelect('EXCELENTE')}
        >
          {/* Aquí iría la imagen y texto de "EXCELENTE" */}
          <div className="icon-placeholder">☀️</div>
          <span className="option-text excelente">EXCELENTE</span>
        </div>
      </div>

      {/* --- Campo de Justificación --- */}
      <div className="justification-section">
        <label htmlFor="justification-input">¿Porque?</label>
        <textarea
          id="justification-input"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Escribe tu razón aquí..."
          rows="4"
        />
      </div>

      {/* --- Botón y Mensaje de Estado --- */}
      <button 
        className="submit-button" 
        onClick={handleSubmit} 
        disabled={!opinion || statusMessage === 'Enviando...'}
      >
        Enviar
      </button>

      {statusMessage && <p className="status-message">{statusMessage}</p>}
    </div>
  );
};

export default OpinionPage;