import { useState } from "react";
import SquareSpinner from "../others/SquareSpinner.jsx";

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, actionLabel }) => {
    const [isConfirming, setIsConfirming] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm();
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <div className="fixed inset-0 
        bg-black/50 dark:bg-black/50 
        backdrop-blur-xs 
        flex items-center justify-center z-50
        transition-colors duration-300"
        >
            <div className="
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-200
            rounded-xl w-11/12 max-w-md p-6
            shadow-xl
            border border-gray-200 dark:border-blue-900/50
            transition-colors duration-300
        ">
                <h2 className="text-xl font-semibold mb-4">
                    {title}
                </h2>

                <div className="mb-6 text-gray-600 dark:text-gray-300">
                    {message}
                </div>

                <div className="flex justify-end gap-3">
                    {/* Confirm */}
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirming}
                        className={`
                            px-5 py-2.5 rounded-lg hover:cursor-pointer
                            text-white
                            transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-green-400/60
                            ${isConfirming
                                ? "bg-green-700/60 cursor-not-allowed"
                                : "bg-green-700 hover:bg-green-600 shadow-sm hover:shadow-md"
                            }
    `}
                    >
                        {isConfirming ? (
                            <div className="flex items-center justify-center gap-2">
                                <SquareSpinner size="w-4 h-4" />
                                <span>{actionLabel}</span>
                            </div>
                        ) : (
                            "Confirm"
                        )}
                    </button>

                    {/* Cancel */}
                    <button
                        onClick={onCancel}
                        disabled={isConfirming}
                        className={`
                        px-5 py-2.5 rounded-lg font-medium hover:cursor-pointer
                        transition-all duration-200
                        ${isConfirming
                                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                : `
                                    bg-gray-200 hover:bg-gray-300 text-gray-800
                                    dark:bg-gray-800 dark:hover:bg-gray-900 border dark:border-gray-200 dark:text-gray-200
                                    active:scale-95
                                  `
                            }
                    `}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>

    );
};

export default ConfirmationModal;
