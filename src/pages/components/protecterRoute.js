import { Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { doc, getDoc } from 'firebase/firestore';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [redirect, setRedirect] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const rol = userSnap.data().rol?.toLowerCase();
          setUserRole(rol);

          // Si hay restricciones de rol y no está permitido
          if (allowedRoles.length > 0 && !allowedRoles.includes(rol)) {
            Swal.fire({
              icon: 'error',
              title: 'Acceso denegado',
              text: 'No tienes permisos para acceder a esta ruta.',
              timer: 2500,
              background: '#052b27ff', // Color de fondo personalizado
              color: '#ffdfdfff', // Color del texto personalizado
              showConfirmButton: false,
            });
            setRedirect(<Navigate to="/dashboard" replace />);
          }
        }
      }
    };

    if (!loading && user) {
      fetchUserRole();
    } else if (!loading && !user) {
      const logoutFlag = sessionStorage.getItem("logout");

      if (!logoutFlag) {
        Swal.fire({
          icon: 'warning',
          title: 'Acceso restringido',
          text: 'Debes iniciar sesión para acceder a esta página.',
          timer: 2000, 
          background: '#0c635aff', // Color de fondo personalizado       
          color: '#ffdfdfff', // Color del texto personalizado
          showConfirmButton: false,
        });
      } else {
        sessionStorage.removeItem("logout");
      }

      setRedirect(<Navigate to="/" state={{ from: location }} replace />);
    }
  }, [loading, user, allowedRoles, location]);

  if (redirect) {
    return redirect;
  }
  return children;
}

export default ProtectedRoute;
