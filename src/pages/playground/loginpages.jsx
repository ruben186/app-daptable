import { useState } from "react";
import './loginpages.css'
import Swal from "sweetalert2";
function Home(){
    const [UserName, setUserName] = useState('');
    function handeleLoginClick(){
        if(UserName.trim() === ''){
            Swal.fire("Porfavor Ingresar un nombre valido");
        }else{
            Swal.fire(UserName);
        }
    }
    return(
        <div className="login-container">
            <h2>Ejercicio de prueba</h2>
            <input type="text"
                placeholder="Escribe nombre de usuario"
                value={UserName}
                onChange={(e) =>setUserName(e.target.value)} 
            />
            <button onClick={handeleLoginClick}>Iniciar Sesión</button>
        </div>
    );
}
export default Home;