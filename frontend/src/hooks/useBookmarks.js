import { useQuery } from "@tanstack/react-query";

import API from "../api/axios";
import { queryKeys } from "../api/queryKeys";
import { useAuth } from "../context/useAuth";

const fetchBookmarks = async () => {
  const { data } = await API.get("/bookmarks");

  // The API returns { bookmarks: [{ id, storyId, story }] },
  // so lift the nested story out for StoryCard.
  return (data.bookmarks ?? [])
    .map((bookmark) => bookmark.story)
    .filter(Boolean);
};

export const useBookmarks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.bookmarks,
    queryFn: fetchBookmarks,
    // /bookmarks is a protected route, so skip the request when signed out.
    enabled: Boolean(user)
  });
};
