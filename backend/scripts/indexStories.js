require("dotenv/config");

const {
  bulkIndexStories
} = require("../services/searchService");

const {
  connectElasticsearch
} = require("../utils/elasticsearch");

const run = async () => {
  try {
    await connectElasticsearch();

    const result =
      await bulkIndexStories();

    console.log(
      "Indexing completed:",
      result
    );
  } catch (error) {
    console.error(
      "Indexing failed:",
      error
    );

    process.exitCode = 1;
  }
};

run();