import { Link } from "react-router-dom";
function HookGral(){
    return (
        <div>
            <h1>Hoocks General</h1>
            <Link to="/usestate">
                <button>Ir a Hook useState</button>
            </Link>
        </div>
    );
}
export default HookGral;