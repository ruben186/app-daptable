import { useState } from 'react';
import Swal from 'sweetalert2';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { db } from '../../firebase';
import { doc, setDoc, } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './registerPage.css';
import logo from '../../assets/logos/App-Daptable-Cel.png';
import ojoAbierto from '../../assets/Iconos/ojo_abierto_contraseña.png';
import ojoCerrado from '../../assets/Iconos/ojo_cerrado_contraseña.png';

function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sexoOpen, setSexoOpen] = useState(false);
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
  const MIN_AGE = 1;
  const MAX_AGE = 120;

  const validateAge = (birthDateString) => {
      if (!birthDateString) return false;

      const birthDate = new Date(birthDateString);
      const today = new Date();

      // Calcula la diferencia en milisegundos
      const ageInMilliseconds = today.getTime() - birthDate.getTime();
      
      // Convierte milisegundos a años
      const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

      return ageInYears >= MIN_AGE && ageInYears <= MAX_AGE;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validaciones
    for (const key in formData) {
      if (formData[key] === '') {
        Swal.fire({
          title:"Campos incompletos", 
          text: "Por favor llena todos los campos.", 
          icon: "error",
          background: '#052b27ff', 
          color: '#ffdfdfff', 
          confirmButtonColor: '#0b6860ff'
        });
        return;
      }
    }
    if(formData.telefono.length > 10 ){
    Swal.fire({
      title:"Error", 
      text: "El numero de telefono debe tener como maximo 10 caracteres.", 
      icon: "error",
      background: '#052b27ff', 
      color: '#ffdfdfff', 
      confirmButtonColor: '#0b6860ff'
    });
    return;
  }
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
     if (!soloLetras.test(formData.nombreCompleto)) {
      Swal.fire({
        title:"Error", 
        text: "El campo de su nombre completo solo debe contener letras.", 
        icon: "error",
        background: '#052b27ff', 
        color: '#ffdfdfff', 
        confirmButtonColor: '#0b6860ff'
      });
      return;
    }
    if (!validateAge(formData.fechaNacimiento)) {
      Swal.fire({
        title: "Error",
        text: `La fecha de nacimiento es invalida.`,
        icon: "error",
        background: '#052b27ff',
        color: '#ffdfdfff',
        confirmButtonColor: '#0b6860ff'
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire({
        title:"Correo inválido", 
        text: "Escribe un correo válido.", 
        icon: "error",
        background: '#052b27ff', 
        color: '#ffdfdfff',
        confirmButtonColor: '#0b6860ff'
      });
      return;
    }

    if(formData.password.length < 6){
      Swal.fire({
        title:"Error", 
        text: "la contraseña debe tener como minimo 6 caracteres.", 
        icon: "error",
        background: '#052b27ff',
        color: '#ffdfdfff', 
        confirmButtonColor: '#0b6860ff'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        title:"Contraseña", 
        text: "Las contraseñas no coinciden.", 
        icon: "error",
        background: '#052b27ff', 
        color: '#ffdfdfff', 
        confirmButtonColor: '#0b6860ff'
      });
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
        estado: 'Pendiente',
        rol: 'Usuario' 
      });
      Swal.fire({
        title:"¡Registro exitoso!", 
        text: "Usuario registrado correctamente.", 
        icon: "success",
        background: '#052b27ff', 
        color: '#ffffffff',
        confirmButtonColor: '#0b6860ff'
      }).then(() => {
        window.location.href = "/";
      });
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Swal.fire({
          title:"Error", 
          text: "Este correo ya está registrado.", 
          icon: "error",
          background: '#052b27ff',
          color: '#ffdfdfff', 
          confirmButtonColor: '#0b6860ff'
        });
      } else {
        console.error(error);
        Swal.fire({
          title:"Error", 
          text: "No se pudo registrar el usuario.", 
          icon: "error",
          background: '#052b27ff', 
          color: '#ffdfdfff', 
          confirmButtonColor: '#0b6860ff'
        });
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-gradient2">
        <button type="button" className="btn-outline-secondary" onClick={() => navigate(-1)}>
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
            <div className={`select-wrapper ${sexoOpen ? 'open' : ''}`}>
              <select
                className="form-control2"
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                onBlur={() => setSexoOpen(false)}
                onClick={() => setSexoOpen(prev => !prev)}
              >
                <option value="">Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Indeciso">Prefiero no decirlo</option>
              </select>
              <span className="chev" aria-hidden="true" />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Correo Electrónico</label>
            <input type="email" className="form-control2" name="email" value={formData.email} onChange={handleChange} placeholder="tucorreo@ejemplo.com" />
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
              <div className="login-password-box">
                <input type={showPassword ? "text" : "password"} 
                className="form-control2" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Escribe tu contraseña" 
                required
                />
                <button
                  type="button"
                  className={`login-eye`}
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <img
                    src={showPassword ? ojoCerrado : ojoAbierto}
                    width={'32'}
                    height={'28'}
                    alt={showPassword ? "Icono ojo cerrado" : "Icono ojo abierto"}
                  />
                </button>
              </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Repetir Contraseña</label>
            <div className="login-password-box">
              <input type={showConfirmPassword ? "text" : "password"}
               className="form-control2" 
               name="confirmPassword" 
               value={formData.confirmPassword} 
               onChange={handleChange} 
               placeholder="Confirma tu contraseña" 
               required
               />
              <button
                type="button"
                className={`login-eye`}
                onClick={() => setShowConfirmPassword(prev => !prev)}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <img
                  src={showConfirmPassword ? ojoCerrado : ojoAbierto}
                  width={'32'}
                  height={'28'}
                  alt={showConfirmPassword ? "Icono ojo cerrado" : "Icono ojo abierto"}
                />
              </button>
            </div>
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