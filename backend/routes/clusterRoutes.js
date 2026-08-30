const express = require("express");
const validate = require("../middleware/validateMiddleware");
const controller = require("../controllers/clusterController");
const { clusterIdParamsSchema, clusterQuerySchema } = require("../validations/clusterValidation");

const router = express.Router();

router.get("/clusters", validate(clusterQuerySchema, "query"), controller.getClusters);
router.get("/clusters/:id", validate(clusterIdParamsSchema, "params"), controller.getCluster);

module.exports = router;
