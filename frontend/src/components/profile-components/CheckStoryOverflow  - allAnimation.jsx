import { useState, useRef, useEffect, useLayoutEffect } from "react";

function CheckStoryOverflow({ story, isExpanded, toggleExpanded, isFromSinglePage, containerHeight }) {
    const [overflowing, setOverflowing] = useState(false);
    const textRef = useRef(null);
    const COLLAPSED_LINES = 4;
    const [contentHeight, setContentHeight] = useState(0);
    const [shouldAnimate, setShouldAnimate] = useState(false);


    // Function to remove newlines for the collapsed state
    const collapseText = (text) => {
        return text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    };

    useLayoutEffect(() => {
        const el = textRef.current;
        if (!el) return;

        const fullHeight = el.scrollHeight;
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        const collapsedHeight = lineHeight * COLLAPSED_LINES;

        if (isExpanded) {
            setContentHeight(fullHeight);
        } else {
            setContentHeight(collapsedHeight);
        }
        setOverflowing(fullHeight > collapsedHeight + 1);

    }, [isExpanded, story]);


    const handleToggle = () => {
        setShouldAnimate(true);
        toggleExpanded();
    };

    if (isFromSinglePage) {
        return (
            <div ref={textRef}
                className="text-justify whitespace-pre-line transition-all duration-1000 ease-in-out"
            >
                <p>{story}</p>
            </div>
        )
    }

    return (
        <>
            <div ref={textRef}
                style={{
                    maxHeight: `${contentHeight}px`,
                }}
               className={`text-justify whitespace-pre-line overflow-hidden  transition-[max-height] duration-300 ease-in-out `}
            >
                <p>
                    {!isExpanded ? collapseText(story) : story}
                </p>
            </div>

            {overflowing && (
                <button
                    onClick={handleToggle}
                    className="text-blue-500 dark:text-blue-400/80 font-medium hover:underline mt-2 cursor-pointer"
                >
                    {!isExpanded ? "Read More" : "Show Less"}
                </button>
            )}
        </>
    );
}

export default CheckStoryOverflow;
