import { useState, useRef, useEffect, useLayoutEffect } from "react";

function CheckStoryOverflow({ story, isExpanded, toggleExpanded, isFromSinglePage, containerHeight, animateToggle }) {
    const [overflowing, setOverflowing] = useState(false);
    const textRef = useRef(null);
    const COLLAPSED_LINES = 4;
    const [contentHeight, setContentHeight] = useState(0);
    const normalizedStory = story.trim();

    const collapseText = (text) => { return text.replace(/\n/g, ' ').replace(/\s+/g, ' '); };

    useLayoutEffect(() => {
        const el = textRef.current;
        if (!el) return;

        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        const collapsedHeight = lineHeight * COLLAPSED_LINES;

        // Temporarily set the full text to measure scrollHeight
        const fullText = normalizedStory;
        const originalContent = el.innerText;
        el.innerText = fullText;
        const fullHeight = el.scrollHeight;
        el.innerText = originalContent; // restore

        const shouldCollapse = fullHeight > collapsedHeight;
        setOverflowing(shouldCollapse);

        let newContentHeight = shouldCollapse
            ? isExpanded
                ? fullHeight
                : collapsedHeight
            : fullHeight;

        setContentHeight(newContentHeight);
    }, [isExpanded, story]);

    if (isFromSinglePage) {
        return (
            <div
                ref={textRef}
                className="text-justify whitespace-pre-line transition-all duration-300 ease-in-out"
            >
                <p>
                    {normalizedStory}
                </p>
            </div>
        )
    }

    return (
        <div>
            <div
                ref={textRef}
                style={{
                    maxHeight: `${contentHeight}px`,
                }}
                // className="text-justify whitespace-pre-line overflow-hidden transition-all duration-300 ease-in-out"
                className={`text-justify whitespace-pre-line overflow-hidden
                    ${animateToggle ? "transition-[max-height] duration-800 ease-in-out" : ""}
                `}
            >
                {!isExpanded && overflowing ? collapseText(normalizedStory) : normalizedStory}
            </div>

            {overflowing && (
                <button
                    onClick={toggleExpanded}
                    className="text-blue-500 dark:text-blue-400/80 font-medium hover:underline mt-2 cursor-pointer"
                >
                    {!isExpanded ? "Read More" : "Show Less"}
                </button>
            )}
        </div>
    );
}

export default CheckStoryOverflow;
