const {
    elasticsearchClient
  } = require("../utils/elasticsearch");
  
  const STORIES_INDEX = "stories";
  
  const createStoriesIndex = async () => {
    const exists =
      await elasticsearchClient.indices.exists({
        index: STORIES_INDEX
      });
  
    if (exists) {
      console.log(
        `Elasticsearch index already exists: ${STORIES_INDEX}`
      );
  
      return;
    }
  
    await elasticsearchClient.indices.create({
      index: STORIES_INDEX,
  
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0
      },
  
      mappings: {
        properties: {
          id: {
            type: "keyword"
          },
  
          sourceId: {
            type: "keyword"
          },
  
          externalId: {
            type: "keyword"
          },
  
          canonicalUrl: {
            type: "keyword"
          },
  
          title: {
            type: "text"
          },
  
          author: {
            type: "text"
          },
  
          content: {
            type: "text"
          },
  
          excerpt: {
            type: "text"
          },
  
          points: {
            type: "integer"
          },
  
          publishedAt: {
            type: "date"
          }
        }
      }
    });
  
    console.log(
      `Elasticsearch index created: ${STORIES_INDEX}`
    );
  };
  
  module.exports = {
    STORIES_INDEX,
    createStoriesIndex
  };