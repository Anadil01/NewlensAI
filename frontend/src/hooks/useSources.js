import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";

import API from "../api/axios";
import { queryKeys } from "../api/queryKeys";
import { useToast } from "../context/useToast";

/*
 * Source catalogue and the signed-in user's source preferences.
 *
 * Mirrors useTopics: GET /sources is public, while /me/source-preferences
 * and /sources/:sourceId/follow sit behind `protect`.
 */

/**
 * GET /sources → { sources: [{ id, name, slug, websiteUrl, type,
 *   politicalLean, reliabilityScore, _count: { stories } }] }
 */
export const useSources = () => {
  return useQuery({
    queryKey: queryKeys.sources,

    queryFn: async () => {
      const { data } = await API.get("/sources");

      return data?.sources ?? [];
    },

    staleTime: 5 * 60_000
  });
};

/**
 * GET /me/source-preferences → { preferences: [{ sourceId, preference, source }] }
 */
export const useSourcePreferences = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: queryKeys.sourcePreferences,

    queryFn: async () => {
      const { data } = await API.get("/me/source-preferences");

      return data?.preferences ?? [];
    },

    enabled
  });
};

/**
 * POST /sources/:sourceId/follow, or DELETE when `false` is passed.
 */
export const useToggleSourceFollow = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ sourceId, follow }) => {
      const response = follow
        ? await API.post(`/sources/${sourceId}/follow`)
        : await API.delete(`/sources/${sourceId}/follow`);

      return {
        sourceId,
        follow,
        message: response.message
      };
    },

    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sourcePreferences
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.feed.all
      });

      toast.success(
        result.message ||
          (result.follow ? "Source followed" : "Source unfollowed")
      );
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Could not update this source."
      );
    }
  });
};
