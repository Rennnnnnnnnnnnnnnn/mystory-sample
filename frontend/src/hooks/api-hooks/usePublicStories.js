import api from "../../utils/api";
import { useInfiniteQuery } from "@tanstack/react-query";

export const usePublicStories = (categories = [], limit = 10) => {
    return useInfiniteQuery({
        queryKey: ["publicStories", categories],
        queryFn: async ({ pageParam = null }) => {
            // await new Promise(resolve => setTimeout(resolve, 3000));
            // Build query string
            const params = new URLSearchParams();
            params.append("limit", limit);
            // Append categories safely
            (categories || []).forEach(cat => params.append("categories", cat));
            // Append cursor params for infinite scroll
            if (pageParam?.cursorDate) params.append("cursorDate", pageParam.cursorDate);
            if (pageParam?.cursorId) params.append("cursorId", pageParam.cursorId);

            //console.log("Fetching with params:", params.toString());
            // Axios GET request with full query string
            const res = await api.get(`/api/story/getPublicStories?${params.toString()}`);
            // Log fetched batch
            // console.log("Fetched batch:", {
            //   cursorUsed: pageParam,
            //   postIds: res.data.stories.map(s => s.post_id),
            //   nextCursor: res.data.nextCursor,
            // });
            return res.data;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
        staleTime: 1000 * 60 * 5, // 5 minutes
        //placeholderData: keepPreviousData,
    });
};
