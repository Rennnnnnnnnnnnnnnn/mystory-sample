import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import { Outlet, useLocation } from "react-router-dom";
import ScrollToTopButton from "../components/ScrollToTopButton";

export default function Layout() {
  const [showNavbar, setShowNavbar] = useState(true);
  const location = useLocation();
  const ignoreNextScrollRef = useRef(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setShowNavbar(true);
    ignoreNextScrollRef.current = true;
    lastScrollY.current = window.scrollY;
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (ignoreNextScrollRef.current) {
        ignoreNextScrollRef.current = false;
        lastScrollY.current = window.scrollY;
        return;
      }

      if (window.scrollY > lastScrollY.current && window.scrollY > 10) {
        setShowNavbar(false);
      } else if (window.scrollY < lastScrollY.current) {
        setShowNavbar(true);
      }

      lastScrollY.current = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-300 dark:bg-gray-900">
      <div
        className={`
                  fixed top-0 w-full z-50
                  transition-all duration-300 ease-in-out transform
                  ${showNavbar ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}
                `}
      >
        <Navbar />
      </div>

      <main className="">
        <Outlet />
      </main>

      {!location.pathname.startsWith("/story/") && <ScrollToTopButton />}

      {/* <ScrollToTopButton /> */}
    </div>
  );
}
