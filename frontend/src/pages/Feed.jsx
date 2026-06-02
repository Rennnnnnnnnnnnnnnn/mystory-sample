import { useLayoutEffect, useRef, useEffect, useState } from "react";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import api from "../utils/api.js";
import { scrollPositions } from "../utils/scrollPositions.js";
import { emotionFilterConfig } from "../utils/StoryFilters.js";
import useStoryEditor from "../hooks/useStoryEditor.jsx";
import useScrollRestoration from "../hooks/useScrollRestoration.jsx";
import StoryCard from "../components/profile-components/StoryCard";
import StorySkeleton from "../layout/StorySkeleton.jsx";
import EditStoryModal from "../components/modals/EditStoryModal.jsx";
import HorizontalStoryFilters from "../components/feed-components/HorizontalStoryFilters.jsx";
import FiltersPopUp from "../components/feed-components/FiltersPopUp.jsx";
import HorizontalStoryFiltersSkeleton from "../layout/HorizontalFilterSkeleton.jsx";
import FilterIcon from "../assets/FilterIcon.jsx";

const usePublicStories = (categories = [], limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["publicStories", categories],
    queryFn: async ({ pageParam = null }) => {
      const params = new URLSearchParams();
      params.append("limit", limit);
      (categories || []).forEach(cat => params.append("categories", cat));
      // Append cursor params for infinite scroll
      if (pageParam?.cursorDate) params.append("cursorDate", pageParam.cursorDate);
      if (pageParam?.cursorId) params.append("cursorId", pageParam.cursorId);


      // Axios GET request with full query string
      const res = await api.get(`/api/story/getPublicStories?${params.toString()}`);
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    //placeholderData: keepPreviousData,
  });
};

function Feed() {
  const storyEditor = useStoryEditor();
  const [showFilters, setShowFilters] = useState(false);
  const restoredRef = useRef(false);
  const DEFAULT_CATEGORIES = Object.values(emotionFilterConfig).map(f => f.category);
  const [queryCategories, setQueryCategories] = useState(() => {
    const savedActive = localStorage.getItem("activeCategory");
    const savedSelected = localStorage.getItem("selectedCategories");
    const active = savedActive ? JSON.parse(savedActive) : null;
    const selected = savedSelected
      ? JSON.parse(savedSelected)
      : DEFAULT_CATEGORIES;
    return active ? [active] : selected;
  });

  const isFirstLoadRef = useRef(true);

  const [selectedCategories, setSelectedCategories] = useState(() => {
    const saved = localStorage.getItem("selectedCategories");
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // Temporary selection in popup before confirming
  const [tempSelectedCategories, setTempSelectedCategories] = useState(selectedCategories);
  // Currently active horizontal category (null = show all)
  const [activeCategory, setActiveCategory] = useState(() => {
    const saved = localStorage.getItem("activeCategory");
    return saved ? JSON.parse(saved) : null;
  });

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    refetch: getPublicStories,
    isFetchingNextPage,
  } = usePublicStories(queryCategories);

  const stories = data?.pages.flatMap(page => page.stories) || [];

  useEffect(() => {
    localStorage.setItem(
      "selectedCategories",
      JSON.stringify(selectedCategories)
    );
  }, [selectedCategories]);

  useEffect(() => {
    if (stories.length > 0 && isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
    }
  }, [stories.length]);
  // Horizontal filter click
  const handleHorizontalCategory = (category) => {
    if (category === null) {
      setActiveCategory(null);
      setQueryCategories(selectedCategories);
    } else if (activeCategory === category) {
      setActiveCategory(null);
      setQueryCategories(selectedCategories);
    } else {
      setActiveCategory(category);
      setQueryCategories([category]);
    }
  };

  useEffect(() => {
    if (activeCategory && !selectedCategories.includes(activeCategory)) {
      setActiveCategory(null);
    }
  }, [selectedCategories, activeCategory]);

  useEffect(() => {
    setTempSelectedCategories(selectedCategories);
  }, [selectedCategories]);

  useLayoutEffect(() => {
    if (!scrollPositions.feed) {
      window.scrollTo(0, 0);
    }
  }, []);
  //SCROLL POSITION RESTORATION
  useScrollRestoration("feed", stories.length > 0);
  // Infinite scroll on scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (showFilters) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [showFilters]);

  useEffect(() => {
    localStorage.setItem("activeCategory", JSON.stringify(activeCategory));
  }, [activeCategory]);


  if (isLoading && stories.length === 0 && isFirstLoadRef.current) {
    return (
      <div className="bg-gray-300 dark:bg-gray-900 min-h-screen">

        <div className="pt-22 flex justify-center">
          <HorizontalStoryFiltersSkeleton />
        </div>

        <div className="mx-3 lg:mx-50 mt-2">
          <div className="pt-4 pb-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <StorySkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pt-18 min-h-screen">
        <div className="flex justify-center mt-4 px-3 lg:mx-auto">
          <div className="flex items-center gap-1 max-w-full">
            {/* Scrollable filters */}
            <div className="overflow-x-auto">
              <HorizontalStoryFilters
                selectedCategories={selectedCategories}
                activeCategory={activeCategory}
                setActiveCategory={handleHorizontalCategory}
              />
            </div>
            <button
              className="flex flex-shrink-0 items-center p-2 bg-gray-400 dark:bg-white rounded hover:cursor-pointer"
              onClick={() => setShowFilters(true)}
            >
              <FilterIcon className="h-5 w-5 hover:cursor-pointer" />
            </button>
          </div>
        </div>

        <div className="mx-3 lg:mx-50 mt-2">
          {isLoading &&
            <div className="pt-4 pb-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <StorySkeleton key={i} />
              ))}
            </div>
          }
        </div>


        <div className="mt-5">
          <StoryCard
            stories={stories}
            storyEditor={storyEditor}
            fetchStories={getPublicStories}
          />
        </div>
      </div >

      {isFetchingNextPage && (
        <div className="px-3 pb-1 lg:px-50 -mt-2">
          <StorySkeleton />
        </div>
      )}

      <EditStoryModal
        isOpen={storyEditor.open}
        onClose={storyEditor.close}
        storyToEdit={storyEditor.storyToEdit}
        fetchStories={getPublicStories}
      />

      {
        showFilters && (
          <FiltersPopUp
            selectedCategories={tempSelectedCategories}
            setSelectedCategories={setTempSelectedCategories}
            onClose={() => setShowFilters(false)}
            onSave={(newCategories) => { // <-- receive tempCategories here
              setSelectedCategories(newCategories); // commit changes
              setQueryCategories(newCategories);    // update stories fetch
              setActiveCategory(null);               // highlight "All"
              setShowFilters(false);                 // close popup
            }}
          />
        )
      }
    </>
  );
}
export default Feed;
