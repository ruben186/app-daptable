import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

function UseEffectPlay() {
    const [numero, setNumero] = useState(0);
    const [mensaje, setMensaje] = useState('');

    useEffect(() => {
        console.log('El número cambió:', numero);
        setMensaje(`¡El número cambió a: ${numero}!`);
    }, [numero]);

    const mostrarAlerta = () => {
        Swal.fire({
            title: 'SweetAlert!',
            text: 'Esta es una alerta de prueba.',
            icon: 'info',
            confirmButtonText: 'Ok'
        });
    };

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Ejemplo de useEffect</h2>
            <p>{mensaje}</p>
            <p>Valor actual: {numero}</p>
            <button onClick={() => setNumero(numero + 1)} className="btn btn-primary me-2">Incrementar</button>
            <button onClick={mostrarAlerta} className="btn btn-success">Mostrar SweetAlert</button>
        </div>
    );
}

export default UseEffectPlay;