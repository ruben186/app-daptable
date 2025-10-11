import { Link } from 'react-router-dom';

function NotFoundPage() {
    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
            <div className="card shadow p-5 text-center" style={{ maxWidth: '500px' }}>
                <h1 className="display-4 text-danger mb-3">404</h1>
                <p className="lead mb-4">
                    ¡Ups! La página que buscas no existe o fue movida.
                </p>
                <Link to="/" className="btn btn-primary">
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}

export default NotFoundPage;