import { useState, useEffect } from "react";
import { useAuth } from "../../pages/auth/AuthProvider";
import api from "../../utils/api";
import { useQueryClient } from "@tanstack/react-query";
import SquareSpinner from "../others/SquareSpinner";

export default function LoginRegisterModal({ onSuccess, onCancel, title }) {
    const queryClient = useQueryClient();
    const { login } = useAuth();

    const [info, setInfo] = useState({
        identifier: "",
        username: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoginRegisterMode, setIsLoginRegisterMode] = useState(true);
    const [postRegister, setPostRegister] = useState(false);

    const handleOnChange = (e) => {
        const { name, value } = e.target;
        setInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (isLoginRegisterMode) {
            try {
                const res = await api.post("/api/auth/login", {
                    identifier: info.identifier,
                    password: info.password,
                });

                // SAVE TOKENS
                localStorage.setItem(
                    "accessToken",
                    res.data.accessToken
                );

                localStorage.setItem(
                    "refreshToken",
                    res.data.refreshToken
                );

                queryClient.invalidateQueries({
                    queryKey: ["publicStories"]
                });

                login(res.data.userData);

                onSuccess();

                setError("");

            } catch (err) {
                setError(
                    err.response?.data?.error ||
                    "Login failed. Please try again."
                );

            } finally {
                setLoading(false);
            }
        }

        if (!isLoginRegisterMode) {
            try {
                const res = await api.post("/api/auth/register", {
                    username: info.username,
                    email: info.email || null,
                    password: info.password,
                });

                // Show spinner + success message
                setSuccessMessage(res.data?.message || "Registration successful!");
                setError("");
                setPostRegister(true);

                setTimeout(() => {
                    setIsLoginRegisterMode(true); // switch to login
                    setPostRegister(false);
                    setSuccessMessage("");
                    setInfo({
                        identifier: "",
                        username: "",
                        email: "",
                        password: "",
                    });
                }, 2500);
            } catch (err) {
                setError(err.response?.data?.error || "Registration failed. Try again.");
                setSuccessMessage("");
            } finally {
                setLoading(false);
            }
        }
    };

    // Prevent background scrolling when a modal is open
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);




    useEffect(() => {
        setError("");
        setSuccessMessage("");
        setInfo({
            identifier: "",
            username: "",
            email: "",
            password: "",
        });
    }, [isLoginRegisterMode]);

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-100 backdrop-blur-xs">
            <div className="w-full max-w-md bg-gray-800 border border-blue-900/50 rounded-xl p-8 shadow-lg relative text-white">
                <button
                    onClick={onCancel}
                    aria-label="Close modal"
                    className="absolute top-2 right-4 text-2xl font-bold text-white cursor-pointer"
                >
                    ×
                </button>
                {postRegister ? (
                    // POST-REGISTRATION: show spinner + message only
                    <div className="flex flex-col items-center justify-center py-8">
                        <SquareSpinner size="border-3 w-10 h-10" />
                        <p className="text-green-400 text-center mt-5 mb-2">{successMessage}</p>
                        <p>Redirecting to sign in page</p>
                    </div>
                ) : (
                    // NORMAL LOGIN / REGISTER FORM
                    <>
                        <h2 className="text-2xl font-semibold text-center mb-10">
                            {isLoginRegisterMode ? title || "Sign In" : "Create account"}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {isLoginRegisterMode ? (
                                // LOGIN FORM
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Username / Email
                                        </label>
                                        <input
                                            type="text"
                                            name="identifier"
                                            value={info.identifier}
                                            onChange={handleOnChange}
                                            required
                                            placeholder="Username / Email"
                                            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-gray-200 border border-gray-600 placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={info.password}
                                            onChange={handleOnChange}
                                            required
                                            disabled={loading}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-gray-200 border border-gray-600 focus:outline-none focus:border-cyan-500 transition"
                                        />
                                    </div>
                                </>
                            ) : (
                                // REGISTER FORM
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={info.username}
                                            onChange={handleOnChange}
                                            required
                                            placeholder="Username"
                                            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-gray-200 border border-gray-600 focus:outline-none focus:border-cyan-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={info.email}
                                            onChange={handleOnChange}
                                            placeholder="you@example.com"
                                            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-gray-200 border border-gray-600 focus:outline-none focus:border-cyan-500 transition"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            ( Optional ) Email can be added later.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={info.password}
                                            onChange={handleOnChange}
                                            required
                                            disabled={loading}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-gray-200 border border-gray-600 focus:outline-none focus:border-cyan-500 transition"
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2
                                        bg-blue-500 hover:bg-blue-600
                                        ${loading ? "opacity-60 cursor-not-allowed" : ""}`}                            >
                                {loading && (
                                    <SquareSpinner />
                                )}

                                {isLoginRegisterMode
                                    ? (loading ? "Signing in . . ." : "Sign In")
                                    : (loading ? "Creating account . . ." : "Create Account")}
                            </button>
                        </form>

                        <div className="w-full m-1 text-center">
                            {isLoginRegisterMode ? (
                                <p
                                    className="text-sm cursor-pointer hover:underline hover:text-blue-400 hover:decoration-blue-500"
                                    onClick={() => setIsLoginRegisterMode(false)}
                                >
                                    Don't have an account?
                                </p>
                            ) : (
                                <p
                                    className="text-sm cursor-pointer hover:underline hover:text-blue-400 hover:decoration-blue-500"
                                    onClick={() => setIsLoginRegisterMode(true)}
                                >
                                    Already have an account?
                                </p>
                            )}
                        </div>

                        {error && <p className="text-red-400 mt-4 text-center text-sm">{error}</p>}
                    </>
                )}
            </div>
        </div>
    );
}