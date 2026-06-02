import { useState, useEffect } from "react";
import ArrowUp from "../assets/ArrowUp";

export default function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => setVisible(window.scrollY > 300);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (!visible) return null;

    return (
        <button
            onClick={scrollToTop}
            className="fixed hover:cursor-pointer bottom-5 right-5 p-4 bg-gray-600 hover:bg-gray-800 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-full shadow-lg hover:-translate-y-1 active:scale-80 active:-translate-y-1 transition-all duration-150"
        >
            <ArrowUp className="h-6 w-6 text-white" />
        </button>
    );
}
