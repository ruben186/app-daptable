import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Rutas públicas
import LoginPage from './pages/loginpages/LoginPage';
import RegisterPage from './pages/registerpage/registerPage';
import ForgotPasswordPage from './pages/forgotpage/forgotPage';
import NotFoundPage from  './pages/components/notFoundPage';

// Rutas para hooks
import UseStatePlay from './pages/playground/UseStatePlay';
import UseEffectPlay from './pages/playground/UseEffectPlay';
import UseRefPlay from './pages/playground/UseRefPlay';

// Protege rutas con autenticación Firebase
import ProtectedRoute from './pages/components/protecterRoute';
import DashboardPage from './pages/dashBoardPage/dashBoardPage';
import ResetPasswordPage from './pages/resetPasswordPage/resetPasswordPage';
import GeneradorTablaPage from './pages/GeneradorTablaPage/GeneradorTablaPage.jsx';
import PerfilPage from './pages/perfilPage/PerfilPage.jsx';
import GestionAdminPage from './pages/gestionAdminPage/gestionAdminPage.jsx';
import GestionUsuariosPage from './pages/gestionUsuarioPage/gestionUsuarioPage.jsx';
import GestionPiezasPage from './pages/gestionPiezasPage/gestionPiezasPage.jsx';
import Xiaomi from './pages/xiaomi/xiaomi.jsx';
import RegNuevoUsuario from './pages/registroNuevoUsuario/registroNuevoUsuario';
import SugerirPieza from './pages/sugerirPieza/sugerirPiezaPage.jsx';
import BtnMasXiaomi from './pages/xiaomi/btnMasXiaomi.jsx';
import GestionSugerenciasPage from './pages/gestionSugerenciasPage/gestionSugerenciasPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        

        {/* Rutas protegidas con Firebase Auth */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'invitado', 'usuario']}>
            <DashboardPage />
          </ProtectedRoute>
        } />


        <Route path="/xiaomi" element={
          <ProtectedRoute allowedRoles={['admin', 'invitado', 'usuario']}>
            <Xiaomi/>
          </ProtectedRoute>
        } />

        
        <Route path="/btnMasXiaomi" element={
          <ProtectedRoute allowedRoles={['admin', 'invitado', 'usuario']}>
            <BtnMasXiaomi/>
          </ProtectedRoute>
        } />
        

        <Route path="/gestionUsuarios" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <GestionUsuariosPage/>
          </ProtectedRoute>
        } />

         <Route path="/gestionPiezas" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <GestionPiezasPage/>
          </ProtectedRoute>
        } />


        <Route path="/TablaCel" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <GeneradorTablaPage/>
          </ProtectedRoute>
        } />
        
        <Route path="/perfil" element={
          <ProtectedRoute allowedRoles={['admin', 'usuario']}>
            <PerfilPage/>
          </ProtectedRoute>
        } />

        <Route path="/gestionAdmin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <GestionAdminPage />
          </ProtectedRoute>
        } />

         <Route path="/nuevoUsuario" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <RegNuevoUsuario/>
          </ProtectedRoute>
        } />

         <Route path="/sugerirPieza" element={
          <ProtectedRoute allowedRoles={['admin', 'usuario']}>
            <SugerirPieza/>
          </ProtectedRoute>
        } />

         <Route path="/gestionSugerencias" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <GestionSugerenciasPage/>
          </ProtectedRoute>
        } />


       



        {/* Ruta genérica para páginas no encontradas */}
        <Route path="*" element={<NotFoundPage />} />

        {/* Rutas para prácticas de hooks */}
        <Route path="/usestate" element={<UseStatePlay />} />
        <Route path="/useeffect" element={<UseEffectPlay />} />
        <Route path="/useref" element={<UseRefPlay />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;