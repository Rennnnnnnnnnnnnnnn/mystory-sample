import { useState, useRef, useEffect } from "react";

function CheckStoryOverflow({ story, isExpanded, toggleExpanded, isFromSinglePage }) {
    const [overflowing, setOverflowing] = useState(false);
    const textRef = useRef(null);

    const checkOverflow = () => {
        const el = textRef.current;
        if (!el) return;

        // Only check overflow when collapsed
        if (!isExpanded) {
            setOverflowing(el.scrollHeight > el.clientHeight + 1);
        }
    };

    useEffect(() => {
        checkOverflow();
        window.addEventListener("resize", checkOverflow);
        return () => window.removeEventListener("resize", checkOverflow);
    }, [story, isExpanded]);



    if (isFromSinglePage) {
        return (
            <div>
                <p
                    ref={textRef}
                    className={`text-justify whitespace-pre-line }`}
                >
                    {story}
                </p>
            </div>
        )
    }

    return (
        <div>
            <p
                ref={textRef}
                className={`text-justify whitespace-pre-line ${!isExpanded ? "line-clamp-4" : ""}`}
            >
                {story}
            </p>

            {overflowing && (
                <button
                    onClick={toggleExpanded}
                    className="text-blue-500 dark:text-blue-400/80 font-medium hover:underline mt-2 cursor-pointer"
                >
                    {isExpanded ? "Show Less" : "Read More"}
                </button>
            )}
        </div>
    );
}

export default CheckStoryOverflow;