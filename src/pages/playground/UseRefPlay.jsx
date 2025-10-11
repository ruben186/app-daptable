import { useRef } from 'react';

function UseRefPlay() {
    const inputRef = useRef(null);

    const enfocar = () => {
        inputRef.current.focus();
    };

    return (
        <div>
            <input ref={inputRef} placeholder="Escribe algo..." />
            <button onClick={enfocar}>Enfocar input</button>
        </div>
    );
}

export default UseRefPlay;