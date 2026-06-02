import { useEffect, useRef, useState } from "react";
import { emotionFilterConfig } from "../../utils/StoryFilters";

function FiltersPopUp({ onClose, onSave, selectedCategories, setSelectedCategories }) {
    const popupRef = useRef(null);
    const [showWarning, setShowWarning] = useState(false);
    const [tempCategories, setTempCategories] = useState([...selectedCategories]);

    const [closing, setClosing] = useState(false);
    const [opening, setOpening] = useState(true);

    useEffect(() => {
        const timeout = setTimeout(() => setOpening(false), 10); // start slide-up
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setClosing(true);
                setTimeout(() => onClose(), 250); // match animation duration
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const toggleFilter = (filterName) => {
        setTempCategories((prev) => {
            if (prev.includes(filterName) && prev.length === 1) {
                setShowWarning(true);
                setTimeout(() => setShowWarning(false), 2500);
                return prev;
            }
            return prev.includes(filterName)
                ? prev.filter((f) => f !== filterName)
                : [...prev, filterName];
        });
    };

    const selectAllFilters = () => {
        setTempCategories(Object.values(emotionFilterConfig).map(f => f.category));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center backdrop-blur-xs items-end dark:text-white">
            {/* Popup Container */}
            <div
                ref={popupRef}
                onClick={(e) => e.stopPropagation()}
                className={`flex flex-col gap-2 p-5 overflow-x-auto w-full lg:w-1/2 md:w-2/3
                dark:bg-gray-900 bg-gray-300 rounded-lg z-[9999] transition-all duration-300
                ${closing ? "translate-y-full opacity-0" : opening ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
            >
                {/* Header */}
                <div className="text-center text-xl font-semibold mb-3">
                    Story Categories
                </div>

                {/* Category Filters */}
                {Object.values(emotionFilterConfig).map((data, index) => (
                    <label key={index}>
                        <div className="flex justify-between items-center px-4 py-1 gap-2 dark:bg-gray-700 bg-gray-400 rounded-lg accent-blue-900 hover:cursor-pointer">
                            <span>{data.category}</span>
                            <input
                                type="checkbox"
                                checked={tempCategories.includes(data.category)}
                                onChange={() => toggleFilter(data.category)}
                                className="w-5 h-5"
                            />
                        </div>
                    </label>
                ))}

                {/* Reset & Warning */}
                <div className="flex justify-evenly items-center w-full">
                    {showWarning ? (
                        <span className="text-red-400 text-md text-center">
                            At least one category must be selected
                        </span>
                    ) : (
                        <>
                            <button
                                className="px-5 py-2 rounded-lg border border-gray-600 dark:border-gray-600 text-black dark:text-white hover:bg-gray-400/50 dark:hover:bg-gray-700 transition-colors hover:cursor-pointer"
                                onClick={selectAllFilters}
                            >
                                Reset
                            </button>

                            <button
                                className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700/90 dark:bg-green-700 text-white transition-colors hover:cursor-pointer"
                                onClick={() => onSave(tempCategories)}
                            >
                                Save
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FiltersPopUp;
