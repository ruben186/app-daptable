import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
// Asegúrate de que las rutas a tu auth y db sean correctas
import { auth, db } from '../../firebase'; 

export const useUserRole = () => {
    const [user, loadingAuth] = useAuthState(auth);
    const [userRole, setUserRole] = useState(null);
    const [loadingRole, setLoadingRole] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            if (user) {
                const userDocRef = doc(db, 'usuarios', user.uid);
                const userSnap = await getDoc(userDocRef);
                
                if (userSnap.exists()) {
                    // Normalizamos el rol a minúsculas, igual que en ProtectedRoute
                    const rol = userSnap.data().rol?.toLowerCase() || 'usuario'; 
                    setUserRole(rol);
                } else {
                    setUserRole('usuario'); // Rol por defecto si falta el documento
                }
            } else {
                setUserRole(null); // No hay usuario
            }
            setLoadingRole(false);
        };

        if (!loadingAuth) {
            fetchRole();
        }
        // Dependencias: [user] para re-ejecutar si el usuario cambia, [loadingAuth] para esperar que Auth termine.
    }, [user, loadingAuth]);

    // Retornamos el rol y el estado de carga
    return { userRole, isRoleLoading: loadingRole };
};