import { useState } from 'react';
import Swal from 'sweetalert2';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import './registerPage.css';
import logo from '../../assets/logos/App-Daptable-Cel.png';

function RegisterPage() {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    fechaNacimiento: '',
    sexo: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    for (const key in formData) {
      if (formData[key] === '') {
        Swal.fire("Campos incompletos", "Por favor llena todos los campos.", "warning");
        return;
      }
    }
    if(formData.telefono.length > 10 ){
      Swal.fire('Error', 'El numero de telefono debe tener como maximo 10 caracteres.', 'error');
      return;
  }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire("Correo inválido", "Escribe un correo válido.", "error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Swal.fire("Contraseña", "Las contraseñas no coinciden.", "error");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Guardar datos adicionales en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        nombreCompleto: formData.nombreCompleto,
        fechaNacimiento: formData.fechaNacimiento,
        sexo: formData.sexo,
        telefono: formData.telefono,
        email: formData.email,
        estado: 'pendiente',// campo para activar o desactivar luego
        rol: 'cliente' 
      });

      Swal.fire("¡Registro exitoso!", "Usuario registrado correctamente.", "success").then(() => {
        window.location.href = "/";
      });
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Swal.fire("Error", "Este correo ya está registrado.", "error");
      } else {
        console.error(error);
        Swal.fire("Error", "No se pudo registrar el usuario.", "error");
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-gradient2">
        <button type="button" className="btn-outline-secondary" onClick={() => window.location.href = "/"}>
          &lt; Volver
        </button>
        <div className="form-left">
          <h3 className="mb-4">Registrate</h3>
          <form onSubmit={handleSubmit}>

          <div className="mb-3">
            <label className="form-label">Nombre y Apellido</label>
            <input type="text" className="form-control2" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange}/>
          </div>

          <div className="mb-3">
            <label className="form-label">Fecha de Nacimiento</label>
            <input type="date" className="form-control2" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label className="form-label">Teléfono</label>
            <input type="tel" className="form-control2" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: 3001234567" />
          </div>

          <div className="mb-3">
            <label className="form-label">Sexo</label>
            <select className="form-control2" name="sexo" value={formData.sexo} onChange={handleChange}>
              <option value="">Seleccionar</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Correo Electrónico</label>
            <input type="email" className="form-control2" name="email" value={formData.email} onChange={handleChange} placeholder="tucorreo@ejemplo.com" />
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input type="password" className="form-control2" name="password" value={formData.password} onChange={handleChange} placeholder="Escribe tu contraseña" />
          </div>

          <div className="mb-3">
            <label className="form-label">Repetir Contraseña</label>
            <input type="password" className="form-control2" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirma tu contraseña" />
          </div>

          <div className="d-grid gap-2">
            <button type="submit" className="btn-primary">Registrar</button>
          </div>
          </form>
        </div>

        <div className="form-right">
          <div className="logo-box">
            <img src={logo} alt="Logo2" className="logo2" />
          </div>
        </div>
    </div>
  );
}

export default RegisterPage;