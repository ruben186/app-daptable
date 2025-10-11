import { useState } from "react";
import Swal from "sweetalert2";
import "./resetPasswordPage.css";
import logo from "../../assets/logos/logoapp-daptable.jpeg";
import { confirmPasswordReset, getAuth } from "firebase/auth";
import { useSearchParams } from "react-router-dom";

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const oobCode = searchParams.get("oobCode");

    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);
    const [match, setMatch] = useState(null);

    const handleRepeatChange = (e) => {
        setRepeatPassword(e.target.value);
        setMatch(e.target.value === password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 6) {
            Swal.fire("Error", "La contraseña debe tener al menos 6 caracteres.", "error");
            return;
        }

        if (password !== repeatPassword) {
            Swal.fire("Error", "Las contraseñas no coinciden.", "error");
            return;
        }

        try {
            const auth = getAuth();
            await confirmPasswordReset(auth, oobCode, password);
            Swal.fire("¡Éxito!", "Tu contraseña se actualizó correctamente.", "success");
            window.location.href = "/";
        } catch (error) {
            console.error(error);
            Swal.fire("Error", error.message, "error");
        }
    };

    const handleGoBack = () => {
        window.location.href = "/";
    };

    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-gradient">
            <div className="form-card">
                <img
                    src={logo}
                    alt="Logo"
                    className="logo mb-3 mx-auto d-block"
                    style={{ width: "250px" }}
                />
                <h3 className="mb-4 text-center">Restablecer contraseña</h3>
                <form onSubmit={handleSubmit}>
                    {/* Campo Nueva contraseña */}
                    <div className="mb-3">
                        <label className="form-label">Nueva contraseña</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control"
                                placeholder="Nueva contraseña"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setMatch(e.target.value === repeatPassword);
                                }}
                                required
                                style={{
                                    backgroundColor: "#333",
                                    color: "#fff",
                                    borderColor: "#555",
                                }}
                            />
                            <i
                                className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"} password-toggle-icon`}
                                onClick={() => setShowPassword(!showPassword)}
                            ></i>
                        </div>
                    </div>

                    {/* Campo Repetir contraseña */}
                    <div className="mb-3">
                        <label className="form-label">Repetir nueva contraseña</label>
                        <div className="password-wrapper">
                            <input
                                type={showRepeatPassword ? "text" : "password"}
                                className={`form-control ${match === null
                                        ? ""
                                        : match
                                            ? "is-valid"
                                            : "is-invalid"
                                    }`}
                                placeholder="Repetir contraseña"
                                value={repeatPassword}
                                onChange={handleRepeatChange}
                                required
                                style={{
                                    backgroundColor: "#333",
                                    color: "#fff",
                                    borderColor: match === false ? "#dc3545" : "#555",
                                }}
                            />
                            <i
                                className={`bi ${showRepeatPassword ? "bi-eye-slash-fill" : "bi-eye-fill"} password-toggle-icon`}
                                onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                            ></i>
                        </div>
                        {match === false && (
                            <div className="invalid-feedback">
                                Las contraseñas no coinciden.
                            </div>
                        )}
                    </div>

                    <div className="d-grid gap-2">
                        <button type="submit" className="btn btn-warning">
                            Cambiar contraseña
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-light"
                            onClick={handleGoBack}
                        >
                            Volver al inicio de sesión
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResetPasswordPage;