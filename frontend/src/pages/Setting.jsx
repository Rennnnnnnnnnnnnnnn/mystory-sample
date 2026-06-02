// React
import { useEffect, useRef, useState } from "react";
// React Query
import { useQuery, useQueryClient, } from "@tanstack/react-query";
// Context
import { useTheme } from "../context/ThemeContext";
// Utils
import api from "../utils/api";
// Components
import DeleteAccountModal from "../components/modals/DeleteAccountModal";
import SquareSpinner from "../components/others/SquareSpinner";

function Settings() {
    // Loading State
    const [loading, setLoading] = useState({
        logout: false,
        username: false,
        email: false,
        password: false,
        delete: false,
        downloadStories: false,
    });

    // React Query
    const queryClient = useQueryClient();

    // Theme
    const { theme, setTheme } = useTheme();

    // Input Refs
    const inputRef = useRef(null);
    const emailInputRef = useRef(null);

    // Edit State
    const [editingField, setEditingField] = useState(null);

    // Username State
    const [newUsername, setNewUsername] = useState("");

    // Email State
    const [newEmail, setNewEmail] = useState("");

    // Password State
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState(null);
    const [passwordStatus, setPasswordStatus] = useState(null);

    // Delete Account State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    // User Query
    const { data: user, isLoading } = useQuery({
        queryKey: ["currentUser"],
        queryFn: async () => {
            const res = await api.get("/api/account/me");
            return res.data;
        },
    });

    // Derived State
    const isUsernameChanged =
        newUsername !== (user?.username || "");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const isEmailValid =
        emailRegex.test(newEmail.trim());

    const isEmailChanged =
        newEmail !== (user?.email || "");

    const isPasswordValid =
        oldPassword.trim().length > 0 &&
        newPassword.trim() &&
        confirmPassword.trim() &&
        newPassword === confirmPassword;

    useEffect(() => {
        if (editingField === "username") {
            inputRef.current?.focus();
        }

        if (editingField === "email") {
            emailInputRef.current?.focus();
        }
    }, [editingField]);

    useEffect(() => {
        if (editingField !== "username") {
            setNewUsername(user?.username || "");
        }

        if (editingField !== "email") {
            setNewEmail(user?.email || "");
        }

        if (editingField !== "password") {
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
    }, [editingField, user]);

    // Handlers
    const handleLogout = async () => {
        setLoading((prev) => ({
            ...prev,
            logout: true,
        }));

        try {

            await api.post("/api/auth/logout", {
                refreshToken: localStorage.getItem("refreshToken")
            });

            // clear local auth
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");

            // reset theme to dark mode
            setTheme(true);
            // clear react-query cache
            queryClient.clear();

            // redirect
            window.location.href = "/";

        } catch (err) {

            console.log("LOGOUT ERROR:", err);
            console.log("LOGOUT RESPONSE:", err.response);
            console.log("LOGOUT DATA:", err.response?.data);

        } finally {

            setLoading((prev) => ({
                ...prev,
                logout: false,
            }));
        }
    };

    const downloadStories = async () => {
        setLoading(prev => ({ ...prev, downloadStories: true }));

        try {
            const res = await api.get("/api/story/downloadStories", {
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "my_stories.docx");

            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.log("DOWNLOAD ERROR:", err);
        } finally {
            setLoading(prev => ({ ...prev, downloadStories: false }));
        }
    };

    const handleDeleteAccount = async (keepPublicPosts, password) => {
        setLoading((prev) => ({
            ...prev,
            delete: true,
        }));

        setDeleteError(null);

        try {
            await api.delete("/api/account/delete", {
                data: { keepPublicPosts, password },
            });

            window.location.href = "/";
        } catch (err) {
            setDeleteError(
                err.response?.data?.error || "Delete failed"
            );
        } finally {
            setLoading((prev) => ({
                ...prev,
                delete: false,
            }));
        }
    };

    return (
        <>
            <div className="text-black dark:text-white max-w-3xl mx-auto space-y-8 px-3 pb-3">
                <h1 className="text-3xl font-semibold text-center">Settings</h1>
                {/* Profile Section */}
                <section className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4 shadow-xl dark:shadow-xs dark:shadow-white">
                    {/* Header */}
                    <p className="text-2xl font-semibold border-b-2 border-gray-900 dark:border-gray-300 pb-4">
                        Account Information
                    </p>

                    {/* Username */}
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                        <p className="font-medium text-gray-800 dark:text-gray-200 flex-shrink-0">
                            Username:
                        </p>

                        <input
                            ref={inputRef}
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            disabled={editingField !== "username"}
                            className={`px-3 py-2 flex-1 min-w-[120px] rounded-md border
                                ${editingField === "username"
                                    ? "border-gray-500 dark:border-gray-400 bg-gray-300 dark:bg-gray-900"
                                    : "border-transparent"}
                                text-gray-900 dark:text-white
                                focus:outline-none`}
                        />
                        <div className="space-x-2 flex items-center flex-shrink-0">
                            <button
                                disabled={
                                    editingField === "username" &&
                                    (!isUsernameChanged || loading.username)
                                }
                                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors
                                ${editingField === "username" && !isUsernameChanged
                                        ? "cursor-not-allowed bg-green-700/80"
                                        : editingField === "username"
                                            ? "bg-green-600 dark:bg-green-700 hover:bg-green-800 dark:hover:bg-green-600 hover:cursor-pointer"
                                            : "bg-blue-800 dark:bg-blue-800 hover:bg-blue-900 dark:hover:bg-blue-700 hover:cursor-pointer"
                                    }
                                text-white disabled:opacity-80 disabled:cursor-not-allowed`}
                                onClick={async () => {
                                    if (editingField !== "username") {
                                        setEditingField("username");
                                        return;
                                    }

                                    if (!isUsernameChanged) return;

                                    try {
                                        setLoading(prev => ({ ...prev, username: true }));
                                        await api.put("/api/account/update-username", {
                                            username: newUsername,
                                        });
                                        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
                                    } catch (err) {
                                        console.log("FULL ERROR:", err);
                                        console.log("RESPONSE:", err.response);
                                        console.log("DATA:", err.response?.data);
                                    } finally {
                                        setLoading(prev => ({ ...prev, username: false }));
                                        setEditingField(null);
                                    }
                                }}
                            >
                                {loading.username ? (
                                    <div className="flex items-center gap-2">
                                        <SquareSpinner size="w-4 h-4" />
                                        <span>Saving</span>
                                    </div>
                                ) : (
                                    editingField === "username" ? "Save" : "Change"
                                )}
                            </button>

                            {editingField === "username" && (
                                <button
                                    onClick={() => setEditingField(null)}
                                    className="px-2.5 py-1.5 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-900 border dark:border-gray-200 hover:cursor-pointer"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                        <p className="font-medium text-gray-800 dark:text-gray-200 flex-shrink-0">
                            Email:
                        </p>

                        <input
                            ref={emailInputRef}
                            type="email"
                            value={newEmail}
                            placeholder={newEmail ? newEmail : "No Email Set"}
                            onChange={(e) => setNewEmail(e.target.value)}
                            disabled={editingField !== "email"}
                            className={`px-3 py-2 flex-1 min-w-[120px] rounded-md border
                                ${editingField === "email"
                                    ? "border-gray-500 dark:border-gray-400 bg-gray-300 dark:bg-gray-900"
                                    : "border-transparent"}
                                    placeholder-gray-700 dark:placeholder-gray-300 text-gray-900 dark:text-white focus:outline-none`}
                        />

                        {editingField === "email" && newEmail && !isEmailValid && (
                            <p className="text-red-500 text-sm">
                                Please enter a valid email address.
                            </p>
                        )}

                        <div className="space-x-2 flex items-center">
                            <button
                                disabled={
                                    editingField === "email" &&
                                    (!isEmailChanged || !isEmailValid || loading.email)
                                }

                                className={`px-4 py-2 text-xs  font-medium rounded-lg transition-colors
                                        ${editingField === "email" && !isEmailChanged
                                        ? "cursor-not-allowed bg-green-700/80"
                                        : editingField === "email"
                                            ? "bg-green-700 dark:bg-green-700 hover:bg-green-900 dark:hover:bg-green-600 hover:cursor-pointer"
                                            : "bg-blue-800 dark:bg-blue-800 hover:bg-blue-900 dark:hover:bg-blue-700 hover:cursor-pointer"
                                    }
                                        text-white disabled:opacity-80 disabled:cursor-not-allowed`}

                                onClick={async () => {
                                    if (editingField !== "email") {
                                        setEditingField("email");
                                        return;
                                    }

                                    if (!isEmailChanged) return;

                                    try {
                                        setLoading(prev => ({ ...prev, email: true }));

                                        await api.put("/api/account/update-email", {
                                            email: newEmail,
                                        });

                                        queryClient.invalidateQueries({ queryKey: ["currentUser"] });

                                    } catch (err) {
                                        console.log("FULL ERROR:", err);
                                        console.log("RESPONSE:", err.response);
                                        console.log("DATA:", err.response?.data.error);
                                    } finally {
                                        setLoading(prev => ({ ...prev, email: false }));
                                        setEditingField(null);
                                    }
                                }}
                            >
                                {loading.email ? (
                                    <div className="flex items-center gap-2">
                                        <SquareSpinner size="w-4 h-4" />
                                        <span>Saving</span>
                                    </div>
                                ) : (
                                    editingField === "email" ? "Save" : "Change"
                                )}
                            </button>

                            {editingField === "email" && (
                                <button
                                    onClick={() => setEditingField(null)}
                                    className="px-2.5 py-1.5 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-900 border dark:border-gray-200 hover:cursor-pointer"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    {/* PASSWORD */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center gap-2">
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                                Password:
                            </p>
                            <div className="space-x-2 flex items-center">
                                <button
                                    disabled={
                                        editingField === "password" &&
                                        (!isPasswordValid || loading.password)
                                    }
                                    onClick={async () => {
                                        if (editingField !== "password") {
                                            setPasswordMessage(null);
                                            setPasswordStatus(null);
                                            setEditingField("password");
                                            return;
                                        }

                                        if (!isPasswordValid) return;

                                        try {
                                            setLoading(prev => ({ ...prev, password: true }));
                                            setPasswordMessage(null);

                                            const res = await api.put("/api/account/update-password", {
                                                oldPassword,
                                                newPassword,
                                            });

                                            setPasswordMessage(res.data.message);
                                            setPasswordStatus("success");

                                            queryClient.invalidateQueries({ queryKey: ["currentUser"] });

                                            setOldPassword("");
                                            setNewPassword("");
                                            setConfirmPassword("");
                                            setTimeout(() => {
                                                setEditingField(null);
                                                setPasswordMessage(null);
                                                setPasswordStatus(null);
                                            }, 2000);

                                        } catch (err) {
                                            console.log("FULL ERROR:", err);
                                            console.log("RESPONSE:", err.response);
                                            console.log("DATA:", err.response?.data);

                                            setPasswordMessage(err.response?.data?.error || "Update failed");
                                            setPasswordStatus("error");
                                        } finally {
                                            setLoading(prev => ({ ...prev, password: false }));
                                            //  setEditingField(null);
                                        }
                                    }}

                                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors
                                            ${editingField === "password" && !isPasswordValid
                                            ? "cursor-not-allowed bg-green-700/80"
                                            : editingField === "password"
                                                ? "bg-green-700 dark:bg-green-700 hover:bg-green-900 dark:hover:bg-green-600 hover:cursor-pointer"
                                                : "bg-blue-800 dark:bg-blue-800 hover:bg-blue-900 dark:hover:bg-blue-700 hover:cursor-pointer"
                                        }
                                            text-white disabled:opacity-80 disabled:cursor-not-allowed`}
                                >
                                    {loading.password ? (
                                        <div className="flex items-center gap-2">
                                            <SquareSpinner size="w-4 h-4" />
                                            <span>Saving</span>
                                        </div>
                                    ) : (
                                        editingField === "password" ? "Save" : "Change"
                                    )}
                                </button>

                                {editingField === "password" && (
                                    <button
                                        onClick={() => setEditingField(null)}
                                        // className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-400 dark:bg-gray-600 text-white hover:bg-gray-500"
                                        className="px-2.5 py-1.5 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-900 border dark:border-gray-200 hover:cursor-pointer"

                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        {editingField === "password" && (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs">Current Password :</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="px-3 py-2 rounded-md border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-900"
                                    />
                                    {passwordMessage && (
                                        <p className={`text-xs ${passwordStatus === "error" ? "text-red-500" : "text-green-500"}`}>
                                            {passwordMessage}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs">New Password :</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="px-3 py-2 rounded-md border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-900"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs">Re-enter New Password :</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="px-3 py-2 rounded-md border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-900"
                                    />



                                    {editingField === "password" &&
                                        confirmPassword &&
                                        newPassword !== confirmPassword && (
                                            <p className="text-red-500 text-sm">
                                                Passwords do not match
                                            </p>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
                {/* Preferences Section */}
                <section className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4 shadow-xl dark:shadow-xs dark:shadow-white">
                    <h2 className="text-2xl font-semibold border-b-2 border-gray-900 dark:border-gray-300 pb-2">
                        Preferences
                    </h2>
                    {/* TOGGLE THEME */}
                    <div className="flex justify-between items-center">
                        <span className="dark:text-gray-100">Dark Mode</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={theme}
                                onChange={() => setTheme(!theme)}
                                className="sr-only"
                            />
                            <div className="w-11 h-6 bg-gray-500 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-300 transition-colors"> </div>
                            <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform ${theme ? "translate-x-5" : "translate-x-0"}`}></div>
                        </label>
                    </div>
                    {/* Download Stories */}
                    <button
                        onClick={downloadStories}
                        disabled={loading.downloadStories}
                        className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-600/70 dark:hover:bg-teal-600 text-white rounded disabled:opacity-70 disabled:cursor-not-allowed hover:cursor-pointer"
                    >
                        {loading.downloadStories ? (
                            <div className="flex items-center justify-center gap-2">
                                <SquareSpinner size="w-4 h-4" />
                                <span>Downloading</span>
                            </div>
                        ) : (
                            "Download My Stories"
                        )}
                    </button>
                </section>
                {/* Account Section */}
                <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-1 space-y-2 shadow-xl dark:shadow-xs dark:shadow-white">
                    <h2 className="text-2xl font-semibold border-b-2 border-gray-900 dark:border-gray-300 pb-2">
                        Account
                    </h2>
                    {/* Log Out */}
                    <button
                        onClick={handleLogout}
                        disabled={loading.logout}
                        className="w-full px-4 py-2 hover:cursor-pointer text-white rounded
        bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600
        disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading.logout ? (
                            <div className="flex items-center justify-center gap-2">
                                <SquareSpinner size="w-4 h-4" />
                                <span>Logging out</span>
                            </div>
                        ) : (
                            "Log Out"
                        )}
                    </button>
                    {/* Delete Account */}
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        // className="w-full px-4 py-2 bg-red-600/90 dark:bg-red-600 text-white rounded hover:bg-red-700 dark:hover:bg-red-500 disabled:opacity-50"
                        className="w-full px-4 py-2 bg-red-600/80 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded hover:cursor-pointer disabled:opacity-50"
                    >
                        Delete Account
                    </button>
                </section>
            </div >

            {isDeleteModalOpen && (
                <DeleteAccountModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    loading={loading.delete}
                    deleteError={deleteError}
                    onConfirm={handleDeleteAccount}
                />
            )
            }
        </>
    );
}

export default Settings;







