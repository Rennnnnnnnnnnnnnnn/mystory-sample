import { useState, useRef, useEffect } from "react";

function CategoryTags({ story, emotionFilterConfig }) {
    const [expanded, setExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const checkOverflow = () => {
            const el = containerRef.current;
            if (el) {
                setIsOverflowing(el.scrollWidth > el.clientWidth);
            }
        };

        checkOverflow();
        window.addEventListener("resize", checkOverflow);
        return () => window.removeEventListener("resize", checkOverflow);
    }, [story.category]);

    const handleToggle = () => {
        if (isOverflowing) {
            setExpanded(!expanded);
        }
    };

    return (
        <div
            ref={containerRef}
            onClick={handleToggle}
            className={`cursor-pointer flex gap-x-1 mt-1
            ${expanded ? "flex-wrap" : "truncate overflow-hidden whitespace-nowrap"} 
            `}
        >
            {/* TAGS: Render each category as a tag */}
            {story.category.map((category, index) => {
                const gradient = Object.values(emotionFilterConfig).find(
                    (item) => item.category === category
                )?.gradient;

                return (
                    <span
                        key={index}
                        className={`text-xs`}
                    >
                        #{category}
                    </span>
                );
            })}
        </div>
    );
}

export default CategoryTags;
