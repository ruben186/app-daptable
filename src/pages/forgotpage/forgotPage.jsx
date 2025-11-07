import { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './forgotPage.css';
import logo from '../../assets/logos/user.png';
import { auth } from '../../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {

      Swal.fire({
              tittle:"Campo vacío", 
              text: "Por favor ingresa tu correo.", 
              icon: "warning",
              background: '#052b27ff', // Color de fondo personalizado
              color: '#ffdfdfff', // Color del texto personalizado
              confirmButtonColor: '#0b6860ff',
            });
      return;
    }

    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formatoCorreo.test(email)) {
       Swal.fire({
              tittle:"Correo inválido", 
              text: "Por favor escribe un correo válido.", 
              icon: "error",
              background: '#052b27ff', // Color de fondo personalizado
              color: '#ffdfdfff', // Color del texto personalizado
              confirmButtonColor: '#0b6860ff',
            });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Swal.fire({
        title: "¡Revisa tu correo!",
        html: `Te hemos enviado instrucciones para recuperar tu contraseña, tienes 60 minutos. <strong>¡Podría estar en SPAM!</strong>`,
        icon: "success",
        timer: 5000,
        showConfirmButton: false
      });
      setEmail('');
    } catch (error) {
      console.error("Error Firebase:", error.code, error.message);
      Swal.fire("Error", error.message, "error");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-page" style={{position: 'relative'}}>
      <button type="button" className="btn-outline-secondary" onClick={() => navigate(-1)}>
          &lt; Volver
      </button>
      <div className="form-card">
        <h3 className="mb-2">Recupera tu Cuenta</h3>
        <p className="subtitle">Para recuperar tu contraseña escribe tu correo</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Correo Electronico:</label>
            <input
              type="email"
              className="form-email"
              id="email"
              placeholder="ejemplo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="d-grid gap-2">
            <button type="submit" className="btn-primary">Enviar Instrucciones</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;