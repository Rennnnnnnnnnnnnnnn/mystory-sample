import { useLayoutEffect, useRef } from "react";
import { scrollPositions } from "../utils/scrollPositions";

function useScrollRestoration(key, ready, delay = 100) {
    const restoredRef = useRef(false);

    // Restore
    useLayoutEffect(() => {
        if (!restoredRef.current && ready) {
            const savedY = scrollPositions[key] || 0;

            // Wait for next paint + optional small delay
            requestAnimationFrame(() => {
               
                    window.scrollTo({ top: savedY, behavior: "auto" });
                    restoredRef.current = true;
             
            });
        }
    }, [ready, key, delay]);

    // Save
    useLayoutEffect(() => {
        return () => {
            scrollPositions[key] = window.scrollY;
        };
    }, [key]);
}

export default useScrollRestoration;
