import {
  useMutation,
  useQueryClient
} from "@tanstack/react-query";

import API from "../api/axios";
import { queryKeys } from "../api/queryKeys";
import { useToast } from "../context/useToast";

export const useToggleBookmark = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (storyId) => {
      const response = await API.post(
        `/stories/${storyId}/bookmark`
      );

      // Payload shape: { bookmarked: boolean }
      return {
        ...response.data,
        message: response.message
      };
    },
    onSuccess: (result) => {
      toast.success(result.message || "Bookmark updated");

      // The bookmarks list changed, so let it refetch instead of
      // patching local state on every screen that shows a story.
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookmarks
      });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Bookmark action failed."
      );
    }
  });
};
