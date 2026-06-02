import api from "../../utils/api";
import { useInfiniteQuery } from "@tanstack/react-query";

export const useGetPrivateStories = (user_id, limit = 10) => {

    return useInfiniteQuery({
        queryKey: ["privateStories", user_id],
        queryFn: async ({ pageParam = null }) => {

            // await new Promise(resolve => setTimeout(resolve, 2000));
            const url = pageParam
                ? `/api/story/getPrivateStories?limit=${limit}&cursor=${pageParam}`
                : `/api/story/getPrivateStories?limit=${limit}`;

            const res = await api.get(url);
            return res.data;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
        enabled: !!user_id,
        staleTime: 1000 * 60 * 5,
        cacheTime: 1000 * 60 * 30,
    });
};