import { useQuery } from "@tanstack/react-query";

import API from "../api/axios";
import { queryKeys } from "../api/queryKeys";

const fetchStories = async ({
  page,
  limit,
  search
}) => {
  const { data } = await API.get("/stories", {
    params: {
      page,
      limit,
      search: search || undefined
    }
  });

  // Payload shape: { stories, pagination }
  return data;
};

export const useStories = ({
  page,
  limit,
  search
}) => {
  return useQuery({
    queryKey: queryKeys.stories.list({
      page,
      limit,
      search
    }),

    queryFn: () => fetchStories({
      page,
      limit,
      search
    })
  });
};
