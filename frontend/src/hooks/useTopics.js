import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";

import API from "../api/axios";
import { queryKeys } from "../api/queryKeys";
import { useToast } from "../context/useToast";

/*
 * Topic catalogue and the signed-in user's topic preferences.
 *
 * GET /topics is public (mounted outside the protected router), while
 * /me/preferences and /topics/:topicId/follow require a session, so those
 * hooks accept an `enabled` flag the pages set from the auth state.
 *
 * Following a topic changes feed ranking, so every mutation here
 * invalidates queryKeys.feed.all alongside the preference list.
 */

/**
 * GET /topics → { topics: [{ id, name, slug, _count: { storyTopics } }] }
 */
export const useTopics = () => {
  return useQuery({
    queryKey: queryKeys.topics,

    queryFn: async () => {
      const { data } = await API.get("/topics");

      return data?.topics ?? [];
    },

    // The catalogue only changes when ingestion introduces a new topic,
    // so it does not need to be revalidated on every mount.
    staleTime: 5 * 60_000
  });
};

/**
 * GET /me/preferences → { preferences: [{ topicId, preference, topic }] }
 */
export const usePreferences = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: queryKeys.preferences,

    queryFn: async () => {
      const { data } = await API.get("/me/preferences");

      return data?.preferences ?? [];
    },

    enabled
  });
};

/**
 * POST /topics/:topicId/follow, or DELETE when `false` is passed.
 *
 * Follow writes a preference of 5; unfollow removes the row entirely
 * rather than zeroing it, so an unfollowed topic stops contributing
 * any signal at all.
 */
export const useToggleTopicFollow = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ topicId, follow }) => {
      const response = follow
        ? await API.post(`/topics/${topicId}/follow`)
        : await API.delete(`/topics/${topicId}/follow`);

      return {
        topicId,
        follow,
        message: response.message
      };
    },

    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.preferences
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.feed.all
      });

      toast.success(
        result.message ||
          (result.follow ? "Topic followed" : "Topic unfollowed")
      );
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Could not update this topic."
      );
    }
  });
};

/**
 * PUT /me/preferences with { preferences: [{ topicId, preference }] }
 *
 * This replaces the whole set in one transaction, which is what the
 * Settings page needs when a user re-weights several topics at once.
 * The backend rejects empty arrays, so callers must send at least one row.
 */
export const useReplacePreferences = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (preferences) => {
      const response = await API.put("/me/preferences", {
        preferences
      });

      return {
        preferences: response.data?.preferences ?? [],
        message: response.message
      };
    },

    onSuccess: (result) => {
      queryClient.setQueryData(
        queryKeys.preferences,
        result.preferences
      );

      queryClient.invalidateQueries({
        queryKey: queryKeys.feed.all
      });

      toast.success(result.message || "Preferences saved");
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Could not save your preferences."
      );
    }
  });
};
