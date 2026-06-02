import { useState, useEffect } from "react";
import SquareSpinner from "../others/SquareSpinner";

const downloadStories = () => {
    window.open("/api/story/downloadStories", "_blank");
};

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, loading, deleteError }) => {
    const [keepPublicPosts, setKeepPublicPosts] = useState(null);
    const [password, setPassword] = useState("");
    const [radioError, setRadioError] = useState(false);
    const [passwordError, setPasswordError] = useState(false); // new state
    const [passwordMismatch, setPasswordMismatch] = useState(false);
    const [showDeleteError, setShowDeleteError] = useState(false);

    const handleConfirm = () => {
        let hasError = false;

        if (keepPublicPosts === null) {
            setRadioError(true);
            setTimeout(() => setRadioError(false), 3000);
            hasError = true;
        }

        if (!password) {
            setPasswordError(true);
            setTimeout(() => setPasswordError(false), 3000);
            hasError = true;
        }

        if (hasError) return;

        onConfirm(keepPublicPosts, password);
    };

    useEffect(() => {
        if (!isOpen) {
            setKeepPublicPosts(null);
            setPassword("");
            setRadioError(false);
            setPasswordError(false);
            setShowDeleteError(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (deleteError) {
            setShowDeleteError(true);

            const timer = setTimeout(() => {
                setShowDeleteError(false);
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [deleteError]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl lg:w-1/2 p-6">
                <h2 className="text-xl text-center font-semibold text-gray-900 dark:text-white mb-3">
                    Confirm Account Deletion
                </h2>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">
                    Before deleting your account make sure to <strong>download</strong> your stories if you want to keep a copy.
                </p>

                <div>
                    <button
                        onClick={downloadStories}
                        className="px-3 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-600 text-white rounded  dark:hover:bg-blue-600 text-sm hover:cursor-pointer"
                    >
                        Download my stories
                    </button>
                </div>

                {/* Keep or delete public stories */}
                <div className="space-y-2 mt-7">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                        Your private stories will <span className="text-red-600 dark:text-red-400">always be deleted</span>.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                        For your public stories, would you like to keep them in the feed or delete them?
                    </p>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="publicStories"
                            value="keep"
                            checked={keepPublicPosts === true}
                            onChange={() => setKeepPublicPosts(true)}
                            className="form-radio h-4 w-4 text-blue-600 dark:text-blue-400 hover:cursor-pointer"
                        />
                        <span className="text-gray-700 dark:text-gray-300 text-sm hover:cursor-pointer">
                            Keep my public stories in the feed
                        </span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="publicStories"
                            value="delete"
                            checked={keepPublicPosts === false}
                            onChange={() => setKeepPublicPosts(false)}
                            className="form-radio h-4 w-4 text-blue-600 dark:text-blue-400 hover:cursor-pointer"
                        />
                        <span className="text-gray-700 dark:text-gray-300 text-sm hover:cursor-pointer">
                            Delete my public stories
                        </span>
                    </label>
                    {radioError && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1 animate-pulse">
                            Please select whether to keep or delete your public stories.
                        </p>
                    )}
                </div>

                {/* Password confirmation */}
                <div className="mt-7">
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
                        Type your password to confirm
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-3 py-2 rounded-md border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                    {passwordError && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1 animate-pulse">
                            Please enter your password.
                        </p>
                    )}

                    {showDeleteError && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1 animate-pulse">
                            {deleteError}
                        </p>
                    )}

                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded hover:bg-red-700 dark:hover:bg-red-400 disabled:opacity-50 hover:cursor-pointer"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <SquareSpinner size="w-4 h-4" />
                                <span>Deleting . . .</span>
                            </div>
                        ) : (
                            "Delete Account"
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 border dark:border-gray-500 text-gray-900 dark:text-white rounded hover:bg-gray-400 hover:cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;