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
import AuxiliaresPage from './pages/auxiliaresPage/auxiliaresPage';
import GeneradorTabla from './pages/GeneradorTabla/GeneradorTabla.jsx';

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
          <ProtectedRoute allowedRoles={['admin', '', 'usuario']}>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/auxiliares" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuxiliaresPage />
          </ProtectedRoute>
        } />

        <Route path="/TablaCel" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <GeneradorTabla/>
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