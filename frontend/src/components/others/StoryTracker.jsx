import { useEffect, useRef, useState, useCallback } from "react";
import api from "../../utils/api";

function StoryTracker({ story, children, isPrivate }) {
    const [hasSentRead, setHasSentRead] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const secondsViewed = useRef(0);
    const containerRef = useRef(null);

    // ----- Calculate dynamic reading time -----
    const words =
        (story.heading ? story.heading.split(/\s+/).length : 0) +
        (story.content ? story.content.split(/\s+/).length : 0);
    const readingSpeedWPM = 280;
    const estimatedTimeSeconds = (words / readingSpeedWPM) * 60;
    const thresholdTime = estimatedTimeSeconds * 0.9;

    // ----- Function to mark story as read -----
    const markAsRead = useCallback(async () => {
        const storageKey = `read_${story.post_id}`;
        const lastRead = localStorage.getItem(storageKey);
        const READ_COOLDOWN = 5 * 60 * 1000; // 5 minutes

        if (lastRead && Date.now() - Number(lastRead) < READ_COOLDOWN) {
            return;
        }
        try {
       //     await api.post(`/api/story/incrementReadCount/${story.post_id}`);
            localStorage.setItem(storageKey, Date.now().toString());
            setHasSentRead(true);
        } catch (err) {
            console.error("Read count error:", err);
        }
    }, [story.post_id]);

    // ----- Intersection Observer -----
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.intersectionRatio >= 0.3);
            },
            { threshold: Array.from({ length: 101 }, (_, i) => i / 100) }
        );

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [story.post_id, words, estimatedTimeSeconds, thresholdTime]);

    // ----- Track scroll depth -----
    const updateScrollProgress = () => {
        if (!containerRef.current || !isVisible) return;

        const progress =
            Math.min(containerRef.current.scrollTop + containerRef.current.clientHeight, containerRef.current.scrollHeight) /
            containerRef.current.scrollHeight;
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        el.addEventListener("scroll", updateScrollProgress);
        return () => el.removeEventListener("scroll", updateScrollProgress);
    }, [story, isVisible]);

    useEffect(() => {
        updateScrollProgress();
    }, [isVisible]);

    // ----- Increment timer while visible -----
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === "visible" && isVisible && containerRef.current) {
                secondsViewed.current += 1;

                const scrollThreshold =
                    containerRef.current.scrollHeight > containerRef.current.clientHeight ? 0.9 : 0;

                const progress =
                    Math.min(containerRef.current.scrollTop + containerRef.current.clientHeight, containerRef.current.scrollHeight) /
                    containerRef.current.scrollHeight;

                if (secondsViewed.current >= thresholdTime && progress >= scrollThreshold && !hasSentRead) {
                    markAsRead();
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isVisible, hasSentRead, markAsRead, thresholdTime, story.post_id]);

    // ----- Reset timer if story leaves viewport -----
    useEffect(() => {
        if (!isVisible) {
            secondsViewed.current = 0;
            setHasSentRead(false);
        }
    }, [isVisible, story.post_id]);

    if (isPrivate) return <div>{children}</div>;

    return (
        <div ref={containerRef} className="relative overflow-auto">
            {children}
        </div>
    );
}

export default StoryTracker;
