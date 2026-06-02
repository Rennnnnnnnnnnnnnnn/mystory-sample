import { useEffect, useState } from "react";

function HeartNotificationToast({ onClose }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(true);
    }, []);

    const handleClose = () => {
        setShow(false);
        setTimeout(onClose, 500);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
            setTimeout(onClose, 500);
        }, 4500);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex justify-center items-end">
            <div
                className={`
                    relative bg-gray-600 dark:bg-blue-600 rounded-lg p-4 text-white w-screen
                    pointer-events-auto
                    transform transition-all duration-300 ease-out
                    ${show ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}
                `}
                onClick={handleClose}
            >
                <button className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-white"    >
                    ✕
                </button>

                <div className="flex flex-col items-center text-center text-sm lg:text-xl">
                    <p>
                        <span>Thank you for reading! 💖</span>
                        <span className="block md:inline"> We'll let the uploader know someone enjoyed their story.</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default HeartNotificationToast;
