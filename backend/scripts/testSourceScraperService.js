const {
    scrapeSource
  } = require("../services/sourceScraperService");
  
  const {
    getSourceBySlug
  } = require("../config/sources");
  
  const prisma = require("../utils/prisma");
  
  const {
    connectRedis,
    redisClient
  } = require("../utils/redis");
  
  const {
    connectElasticsearch,
    elasticsearchClient
  } = require("../utils/elasticsearch");
  
  const run = async () => {
    try {
      // Standalone scripts must initialize
      // infrastructure themselves.
      await connectRedis();
      await connectElasticsearch();
  
      const source =
        getSourceBySlug("hacker-news");
  
      if (!source) {
        throw new Error(
          "Hacker News source not found"
        );
      }
  
      const result =
        await scrapeSource(source);
  
      console.log(
        "Source scrape result:"
      );
  
      console.log(result);
    } catch (error) {
      console.error(
        "Source scraper test failed:",
        error.message
      );
  
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
  
      if (redisClient.isOpen) {
        await redisClient.quit();
      }
  
      await elasticsearchClient.close();
    }
  };
  
  run();