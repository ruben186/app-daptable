import { useState } from 'react';
import Swal from 'sweetalert2';
import { auth, googleProvider, db } from '../../firebase';
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail, linkWithCredential, EmailAuthProvider, signInWithPopup, signInAnonymously} from 'firebase/auth';
import { doc, getDoc , setDoc, collection, query, getDocs, where } from 'firebase/firestore';
import './LoginPage.css';
import logo from '../../assets/logos/App-Daptable-Cel.png';
import ojoAbierto from '../../assets/Iconos/ojo_abierto_contraseña.png';
import ojoCerrado from '../../assets/Iconos/ojo_cerrado_contraseña.png';
import iconoGoogle from '../../assets/Iconos/IconoGoogle.png';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const findUserByPhoneInFirestore = async (phoneNumber) => {
        // Asegúrate de que 'usuarios' es el nombre de tu colección
        const usersRef = collection(db, 'usuarios');
        
        // Crea una consulta para buscar documentos donde el campo 'telefono' coincida
        // con el número de teléfono limpio.
        const q = query(usersRef, where('telefono', '==', phoneNumber));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Si encuentra un usuario, devuelve los datos (incluyendo el email de Auth)
            return querySnapshot.docs[0].data();
        }
        return null;
    };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
       Swal.fire({
          title:"Campos vacíos", 
          text: "Por favor llena todos los campos.", 
          icon: "warning",
          background: '#052b27ff', // Color de fondo personalizado
          color: '#ffdfdfff', // Color del texto personalizado
          confirmButtonColor: '#0b6860ff',
        });
      return;
    }
     if (password.length < 6) {
                return Swal.fire({
                  title:"Error", 
                  text: "Contraseña mínima de 6 caracteres", 
                  icon: "warning",
                  background: '#052b27ff', // Color de fondo personalizado
                  color: '#ffdfdfff', // Color del texto personalizado
                  confirmButtonColor: '#0b6860ff',
                });
            }

    let userIdentifier = email.trim();
    let authEmail = userIdentifier; // Usamos el valor original por defecto
    let isPhoneNumber = false;

    // Si la entrada NO contiene el símbolo '@', la tratamos como un número de teléfono.
  if (!userIdentifier.includes('@')) {
            isPhoneNumber = true;
            userIdentifier = userIdentifier.replace(/[^0-9]/g, '');
            authEmail = userIdentifier; 
        }
    try {
    const userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
      const user = userCredential.user;


      const userDocRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.estado === "Inactivo") {
          Swal.fire({
                        title:"Acceso denegado", 
                        text: "Tu cuenta está inactiva. Contacta al administrador.", 
                        icon: "error",
                        background: '#052b27ff', // Color de fondo personalizado
                        color: '#ffdfdfff', // Color del texto personalizado
                        confirmButtonColor: '#0b6860ff',
                      });
          return;
        }
      }

      Swal.fire({
        title: "¡Bienvenido!",
        text: `Sesión iniciada como ${user.email}`,
        icon: "success",
        background: '#052b27ff', // Color de fondo personalizado
        color: '#ffff', // Color del texto personalizado
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        window.location.href = "/dashboard";
      });

    } catch (error) {
      // Si el error es de credenciales incorrectas (Auth/email-not-found, wrong-password, etc.)
      if (isPhoneNumber) {
          
          const userData = await findUserByPhoneInFirestore(userIdentifier);
          
          if (userData && userData.email) {
              // Si encontramos el usuario por teléfono en Firestore, 
              // extraemos el email asociado (el email real de Auth)
              const realAuthEmail = userData.email; 
              
              try {
                  const userCredential = await signInWithEmailAndPassword(auth, realAuthEmail, password);
                  
                  const user = userCredential.user;
                  

                  const userDocRef = doc(db, 'usuarios', user.uid);
                  const userSnap = await getDoc(userDocRef);
                  
                  if (userSnap.exists()) {
                      const data = userSnap.data();
                      if (data.estado === "Inactivo") {
                          Swal.fire({
                          title:"Acceso denegado", 
                          text: "Tu cuenta está inactiva. Contacta al administrador.", 
                          icon: "error",
                          background: '#052b27ff', // Color de fondo personalizado
                          color: '#ffdfdfff', // Color del texto personalizado
                          confirmButtonColor: '#0b6860ff',
                        });
                        return;
                      }
                  }

                  Swal.fire({
                      title: "¡Bienvenido!",
                      text: `Sesión iniciada como ${user.email}`,
                      icon: "success",
                      background: '#052b27ff',
                      color: '#ffff',
                      timer: 2000,
                      showConfirmButton: false
                  }).then(() => {
                      window.location.href = "/dashboard";
                  });
                  return; 

              } catch (innerError) {
                  // Si falla el Intento 2 (contraseña incorrecta para el email encontrado)
                  console.error("Error en Intento 2 (Email real):", innerError);

              }
          }
      }
      
      console.error("Error final:", error);
      Swal.fire({
          title:"Error", 
          text: "Credenciales incorrectas o usuario no existe.", 
          icon: "error",
          background: '#052b27ff',
          color: '#ffdfdfff',
          confirmButtonColor: '#0b6860ff',
      });
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
          nombreCompleto: user.displayName || '',
          email: user.email,
          telefono: '', 
          fechaNacimiento: '',
          edad: '',
          sexo: '',
          estado: 'Activo',
          rol: 'usuario'
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
        background: '#052b27ff', // Color de fondo personalizado
        color: '#ffff', // Color del texto personalizado
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        window.location.href = "/dashboard";
      });
  
    } catch (error) {
      console.error(error);
      Swal.fire({
        title:"Error", 
        text: "No se pudo iniciar sesión con Google.", 
        icon: "error",
        background: '#052b27ff', // Color de fondo personalizado
        color: '#ffdfdfff', // Color del texto personalizado
        confirmButtonColor: '#0b6860ff',
      });
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

  const handleGuestLogin = async () => {
    try {
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;
        
        // Opcional: Crear un documento de invitado en Firestore si es la primera vez.
        // Esto es útil para darle un rol de 'invitado' y gestionarlo.
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (!userSnap.exists()) {
             await setDoc(userDocRef, {
                nombreCompleto: 'Invitado',
                email: 'anonimo@appdaptable.com',
                telefono: '', 
                rol: 'invitado', 
                estado: 'Activo',
                fechaCreacion: new Date(),
             });
        }
        
        // Notificación de éxito
        Swal.fire({
            title: "¡Bienvenido Invitado!",
            text: "Has iniciado sin cuenta.",
            icon: "info",
            background: '#052b27ff',
            color: '#ffff',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = "/dashboard";
        });

    } catch (error) {
        console.error("Error al iniciar sesión anónimamente:", error);
        Swal.fire({
            title:"Error", 
            text: "No se pudo iniciar como invitado.", 
            icon: "error",
            background: '#052b27ff',
            color: '#ffdfdfff',
            confirmButtonColor: '#0b6860ff',
        });
    }
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
            type="text"
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
          <button type="button" className="login-invited-btn" onClick={handleGuestLogin}>Entrar como invitado</button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;