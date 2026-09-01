const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const clusterService = require("../services/clusterService");

exports.getClusters = asyncHandler(async (req, res) => {
  const result = await clusterService.getClusters(req.query);
  return ApiResponse.success(res, result, "Story clusters fetched successfully");
});

exports.getCluster = asyncHandler(async (req, res) => {
  const result = await clusterService.getCluster(req.params.id);
  return ApiResponse.success(res, result, "Story cluster fetched successfully");
});


exports.getRelatedStories = asyncHandler(async (req, res) => {
  const result = await clusterService.getRelatedStories(req.params.id);

  return ApiResponse.success(
    res,
    result,
    "Related stories fetched successfully"
  );
});