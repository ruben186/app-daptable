import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
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
                    // Se normaliza el rol a minúsculas
                    const rol = userSnap.data().rol?.toLowerCase() || 'usuario'; 
                    setUserRole(rol);
                } else {
                    setUserRole('usuario'); 
                }
            } else {
                setUserRole(null); 
            }
            setLoadingRole(false);
        };

        if (!loadingAuth) {
            fetchRole();
        }
    }, [user, loadingAuth]);

    return { userRole, isRoleLoading: loadingRole };
};