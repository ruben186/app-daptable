import { useState } from "react";
import { Link } from "react-router-dom";
function useStateContador(){
    const [contador, setContador ] = useState(0);
    function aumentar(){
        setContador(contador +1);
    }
    function disminuir(){
        setContador(contador-1);
    }
    return(
        <div>
            <h2>Valor del Contador {contador}</h2>
            <button onClick={aumentar}>Aumentar</button>
            <button onClick={disminuir}>Disminuir</button>
            <Link to="/hook">
                <button>Ir a Hooks General </button>
            </Link>
        </div>
    );
}
export default useStateContador;