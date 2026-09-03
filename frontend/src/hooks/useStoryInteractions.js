import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";

import API from "../api/axios";
import { queryKeys } from "../api/queryKeys";
import { useToast } from "../context/useToast";

/*
 * Personalization signals for a single story.
 *
 * All of these routes sit behind `protect` on the backend, so the queries
 * take an `enabled` flag that pages set from the auth state.
 *
 * Feedback and skip both change how the personalized feed ranks, so their
 * mutations invalidate queryKeys.feed.all as well as their own entry.
 */

/**
 * GET /stories/:id/feedback → { feedback: { feedback: "LIKE" | "DISLIKE" } | null }
 * Unwrapped to "LIKE" | "DISLIKE" | null.
 */
export const useStoryFeedback = (storyId, { enabled = true } = {}) => {
  return useQuery({
    queryKey: queryKeys.storyFeedback(storyId),

    queryFn: async () => {
      const { data } = await API.get(`/stories/${storyId}/feedback`);

      return data?.feedback?.feedback ?? null;
    },

    enabled: Boolean(storyId) && enabled
  });
};

/**
 * POST /stories/:id/feedback with { feedback: "LIKE" | "DISLIKE" }
 * DELETE when `null` is passed, which is how the UI toggles a choice off.
 */
export const useSetStoryFeedback = (storyId) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (feedback) => {
      if (feedback === null) {
        const response = await API.delete(
          `/stories/${storyId}/feedback`
        );

        return {
          feedback: null,
          message: response.message
        };
      }

      const response = await API.post(
        `/stories/${storyId}/feedback`,
        { feedback }
      );

      return {
        feedback,
        message: response.message
      };
    },

    onSuccess: (result) => {
      // Write the new value straight into the cache so the buttons
      // settle immediately instead of flickering through a refetch.
      queryClient.setQueryData(
        queryKeys.storyFeedback(storyId),
        result.feedback
      );

      queryClient.invalidateQueries({
        queryKey: queryKeys.feed.all
      });

      toast.success(result.message || "Feedback saved");
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Could not save feedback."
      );
    }
  });
};

/**
 * GET /stories/:id/skip → { skip: {...} | null }
 */
export const useStorySkip = (storyId, { enabled = true } = {}) => {
  return useQuery({
    queryKey: queryKeys.storySkip(storyId),

    queryFn: async () => {
      const { data } = await API.get(`/stories/${storyId}/skip`);

      return Boolean(data?.skip);
    },

    enabled: Boolean(storyId) && enabled
  });
};

/**
 * POST /stories/:id/skip, or DELETE when `false` is passed.
 * A skipped story is filtered out of the personalized feed.
 */
export const useToggleStorySkip = (storyId) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (shouldSkip) => {
      const response = shouldSkip
        ? await API.post(`/stories/${storyId}/skip`)
        : await API.delete(`/stories/${storyId}/skip`);

      return {
        skipped: shouldSkip,
        message: response.message
      };
    },

    onSuccess: (result) => {
      queryClient.setQueryData(
        queryKeys.storySkip(storyId),
        result.skipped
      );

      queryClient.invalidateQueries({
        queryKey: queryKeys.feed.all
      });

      toast.success(result.message || "Preference saved");
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Could not update this story."
      );
    }
  });
};

/**
 * POST /stories/:id/reading with { durationSeconds, completed }
 *
 * Fired from a page effect rather than a click, so it stays silent:
 * a failed telemetry write should not interrupt reading.
 */
export const useRecordReading = (storyId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ durationSeconds = 0, completed = false } = {}) => {
      const { data } = await API.post(
        `/stories/${storyId}/reading`,
        {
          durationSeconds: Math.max(
            0,
            Math.round(durationSeconds)
          ),
          completed
        }
      );

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.feed.all
      });
    }
  });
};
