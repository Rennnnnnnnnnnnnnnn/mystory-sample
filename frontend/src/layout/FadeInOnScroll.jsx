import React, { useRef, useEffect, useState } from "react";

const FadeInSlide = ({ children, delay = 250, direction, className = "" }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting); // 👈 key change
      },
      { threshold: 0.1 } // lower threshold feels smoother
    );

    const current = ref.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  let transformClass = "";

  switch (direction) {
    case "left":
      transformClass = "-translate-x-15";
      break;
    case "right":
      transformClass = "translate-x-15";
      break;
    case "up":
      transformClass = "translate-y-15";
      break;
    case "down":
      transformClass = "-translate-y-15";
      break;
    default:
      transformClass = "translate-y-15";
  }

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform
        ${isVisible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${transformClass}`
        }
        ${className}`}
    >
      {children}
    </div>
  );
};

export default FadeInSlide;