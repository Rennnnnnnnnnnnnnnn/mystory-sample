import { emotionFilterConfig } from "../../utils/StoryFilters";
import { useRef, useState, useLayoutEffect, useEffect } from "react";
import { scrollPositions } from "../../utils/scrollPositions";

function ButtonCard({ name, gradient, onClick, isActive }) {
    return (
        <button className={`border border-gray-600 dark:border-gray-500 
                px-2 py-2 rounded-lg text-sm font-medium flex-shrink-0
                transition-all duration-300 hover:cursor-pointer hover:dark:border-gray-300 hover:border-black hover:bg-gray-300 dark:hover:bg-gray-800 
                ${isActive
                ? `bg-gradient-to-bl ${gradient} text-black scale-105 opacity-100 ring-2 ring-gray-800 dark:ring-white`
                : "bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-200 opacity-80 hover:opacity-100 "
            }
            `}
            onClick={onClick}
        >
            <small>{name}</small>
        </button>
    );
}

function HorizontalStoryFilters({ selectedCategories, activeCategory, setActiveCategory }) {
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    // RESTORE Position
    useLayoutEffect(() => {
        if (scrollRef.current && scrollPositions.feedFilters) {
            scrollRef.current.scrollLeft = scrollPositions.feedFilters;
        }
    }, []);

    useEffect(() => {
        if (activeCategory === null && scrollRef.current) {
            scrollRef.current.scrollTo({
                left: 0,
                behavior: "smooth",
            });
        }
    }, [activeCategory]);

    // SAVE Position on Scroll
    const handleScroll = () => {
        if (scrollRef.current) {
            scrollPositions.feedFilters = scrollRef.current.scrollLeft;
        }
    };

    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // scroll-fast multiplier
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div className="flex lg:justify-center">
            <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto scrollbar-none cursor-grab px-2"
                onScroll={handleScroll}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >

                <ButtonCard
                    name="All"
                    gradient="dark:from-white dark:to-gray-200 from-gray-300 to-gray-600"
                    isActive={activeCategory === null}
                    onClick={() => setActiveCategory(null)}
                />

                {Object.values(emotionFilterConfig)
                    .filter(f => selectedCategories.includes(f.category))
                    .map((data, index) => (
                        <ButtonCard
                            key={index}
                            name={data.category}
                            gradient={data.gradient}
                            isActive={activeCategory === data.category}
                            onClick={() =>
                                setActiveCategory(
                                    activeCategory === data.category ? null : data.category
                                )
                            }
                        />
                    ))}

            </div>
        </div>
    );
}

export default HorizontalStoryFilters;

