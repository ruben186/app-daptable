import { useState } from 'react';

function UseStatePlay() {
    const [numero, setNumero] = useState(0);

    return (
        <div>
            <p>Valor: {numero}</p>
            <button onClick={() => setNumero(numero + 1)}>
                Aumentar
            </button>
        </div>
    );
}

export default UseStatePlay;