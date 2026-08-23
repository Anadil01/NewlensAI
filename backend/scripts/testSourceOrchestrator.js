const {
  connectRedis
} = require("../utils/redis");

const {
  connectElasticsearch
} = require("../utils/elasticsearch");

const {
  runAllSourceScrapers
} = require("../services/sourceOrchestratorService");

const run = async () => {
  await connectRedis();
  await connectElasticsearch();

  const results =
    await runAllSourceScrapers();

  console.log(
    "All source scrape results:"
  );

  console.dir(results, {
    depth: null
  });
};

run()
  .catch((error) => {
    console.error(
      "Source orchestrator test failed:",
      error.message
    );

    process.exitCode = 1;
  });