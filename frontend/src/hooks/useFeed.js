import { useQuery } from "@tanstack/react-query";

import API from "../api/axios";
import { queryKeys } from "../api/queryKeys";

/*
 * GET /feed/personalized?mode=personalized|latest|trending
 *
 * The route is protected, so it only runs for a signed-in user.
 * Payload shape: { stories, personalization, pagination }
 */
export const useFeed = ({
  mode = "personalized",
  page = 1,
  limit = 10,
  enabled = true
}) => {
  return useQuery({
    queryKey: queryKeys.feed.list({
      mode,
      page,
      limit
    }),

    queryFn: async () => {
      const { data } = await API.get("/feed/personalized", {
        params: {
          mode,
          page,
          limit
        }
      });

      return data;
    },

    enabled,

    // Feed ordering shifts as signals accumulate; a short stale window
    // avoids refetching on every tab switch without showing old ranking.
    staleTime: 30_000
  });
};
