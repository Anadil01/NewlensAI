const { Client } = require("@elastic/elasticsearch");

const config = require("../config/env");

const elasticsearchClient = new Client({
  node: config.elasticsearchUrl
});

const connectElasticsearch = async () => {
  try {
    const response =
      await elasticsearchClient.info();

    console.log(
      `Elasticsearch connected: ${response.version.number}`
    );
  } catch (error) {
    console.error(
      "Elasticsearch connection failed:",
      error.message
    );

    throw error;
  }
};

module.exports = {
  elasticsearchClient,
  connectElasticsearch
};