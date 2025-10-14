import { useState } from 'react';
import Swal from 'sweetalert2';
import { auth, googleProvider, db } from '../../firebase';
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail, linkWithCredential, EmailAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc , setDoc } from 'firebase/firestore';
import './LoginPage.css';
import logo from '../../assets/logos/logoapp-daptable.jpeg';

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
      <h2 className="login-title">Iniciar Sesión</h2>
      <div className="login-container">
        
        <div className="login-logo-box">
          <img src={logo} alt="Logo" className="login-logo" />
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email" className="login-label">Correo electronico:</label>
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
            <span
              className="login-eye"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <svg width="24" height="24" fill="#42bb97" viewBox="0 0 24 24">
                <path d={showPassword
                  ? "M12 4.5C7.305 4.5 3.135 7.364 1.5 12c1.635 4.636 5.805 7.5 10.5 7.5s8.865-2.864 10.5-7.5C20.865 7.364 16.695 4.5 12 4.5zm0 13c-3.038 0-5.5-2.462-5.5-5.5s2.462-5.5 5.5-5.5 5.5 2.462 5.5 5.5-2.462 5.5-5.5 5.5z"
                  : "M12 4.5C7.305 4.5 3.135 7.364 1.5 12c1.635 4.636 5.805 7.5 10.5 7.5s8.865-2.864 10.5-7.5C20.865 7.364 16.695 4.5 12 4.5zm0 13c-3.038 0-5.5-2.462-5.5-5.5s2.462-5.5 5.5-5.5 5.5 2.462 5.5 5.5-2.462 5.5-5.5 5.5z"
                } />
              </svg>
            </span>
          </div>
          <div className="login-links">
            <a href="/forgot" className="login-forgot">¿olvidaste tu contraseña?</a>
          </div>
          <button type="submit" className="login-btn">Iniciar Sesión</button>
        </form>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="login-google-btn"
        >
          <span>Continuar con Google</span>
          <img
            src="https://img.icons8.com/color/48/google-logo.png"
            alt="Google logo"
            className="login-google-icon"
          />
        </button>
        <div className="login-register">
          <a href="/register">No tienes Cuenta? Registrate aqui</a>
        </div>
        <div className="login-invited">
          <a href="/guest">Entrar como invitado</a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;