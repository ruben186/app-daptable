import { useState } from 'react';
import Swal from 'sweetalert2';
import { auth, googleProvider, db } from '../../firebase';
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail, linkWithCredential, EmailAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc , setDoc } from 'firebase/firestore';
import './LoginPage.css';
import logo from '../../assets/logos/App-Daptable-Cel.png';
import ojoAbierto from '../../assets/Iconos/ojo_abierto_contraseña.png';
import ojoCerrado from '../../assets/Iconos/ojo_cerrado_contraseña.png';
import iconoGoogle from '../../assets/Iconos/IconoGoogle.png';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      Swal.fire("Campos vacíos", "Por favor llena todos los campos.", "warning");
      return;
    }
     if (password.length < 6) {
                return Swal.fire("Error", "Contraseña mínima de 6 caracteres", "warning");
            }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;


      const userDocRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.estado === "Inactivo") {
          Swal.fire("Acceso denegado", "Tu cuenta está inactiva. Contacta al administrador.", "error");
          return;
        }
      }

      Swal.fire({
        title: "¡Bienvenido!",
        text: `Sesión iniciada como ${user.email}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        window.location.href = "/dashboard";
      });

    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Credenciales incorrectas o usuario no existe.", "error");
    }
  };


  const handleGoogleLogin = async () => {
    try {
      const googleResult = await signInWithPopup(auth, googleProvider);
      const user = googleResult.user;
  
      const signInMethods = await fetchSignInMethodsForEmail(auth, user.email);
  
      // 1. Verificar si el usuario ya está en la colección 'usuarios'
      const userDocRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userDocRef);
  
      // 2. Si no existe, lo creamos como AUXILIAR por defecto
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          nombres: user.displayName?.split(' ')[0] || '',
          apellidos: user.displayName?.split(' ').slice(1).join(' ') || '',
          email: user.email,
          telefono: '', 
          cedula: '',
          fechaNacimiento: '',
          edad: '',
          sexo: '',
          estado: 'Activo',
          rol: 'Cliente'
        });
      }
  
      // 3. Si el usuario ya tenía email+contraseña, pedir contraseña y vincular
      if (signInMethods.includes('password')) {
        const password = await solicitarPassword();
        if (!password) {
          Swal.fire("Cancelado", "Operación cancelada.", "info");
          return;
        }
  
        const credential = EmailAuthProvider.credential(user.email, password);
        await linkWithCredential(user, credential);
      }
  
      Swal.fire({
        title: "¡Bienvenido!",
        text: `Sesión iniciada con Google: ${user.email}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        window.location.href = "/dashboard";
      });
  
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo iniciar sesión con Google.", "error");
    }
  };

  const solicitarPassword = async () => {
    const result = await Swal.fire({
      title: "Contraseña requerida",
      input: "password",
      inputLabel: "Introduce tu contraseña para vincular cuentas",
      inputPlaceholder: "Tu contraseña",
      showCancelButton: true,
      confirmButtonText: "Vincular",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed && result.value) {
      return result.value;
    }
    return null;
  };

  return (
    <div className="login-bg">
      <div className="login-container">
        <h2 className="login-title">Iniciar Sesión</h2>
        <div className="login-logo-box">
          <img src={logo} alt="Logo" className="login-logo" />
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email" className="login-label">Celular ó Correo electronico:</label>
          <input
            type="email"
            className="login-input"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password" className="login-label">Contraseña:</label>
          <div className="login-password-box">
            <input
              type={showPassword ? "text" : "password"}
              className="login-input"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={`login-eye`}
              onClick={() => setShowPassword(!showPassword)}
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
          <div className="login-links">
            <a href="/forgot" className="login-forgot">olvidaste tu contraseña?</a>
          </div>
          <button type="submit" className="login-btn">Iniciar Sesión</button>
        </form>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="login-google-btn"
        >
          <label>Continuar con Google</label>
          <img src={iconoGoogle} alt="Google logo" className="login-google-icon" />
        </button>
        <div className="login-register">
          <span>No tienes Cuenta? <a href="/register">Registrate aqui</a></span>
        </div>
        <div className="login-invited">
          <button type="button" className="login-invited-btn">Entrar como invitado</button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;