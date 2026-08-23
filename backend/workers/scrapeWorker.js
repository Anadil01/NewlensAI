const { Worker } = require("bullmq");
const ingestionQueue = require("../queues/ingestionQueue");
const connection = require("../queues/connection");

const { getSourceBySlug } = require("../config/sources");
const { scrapeSource } = require("../services/sourceScraperService");

const worker = new Worker(
  "scrape-jobs",
  async (job) => {
    console.log("Processing scrape job:", job.id);

    const source = getSourceBySlug(job.data.source);

    if (!source) {
      throw new Error("Source not found");
    }

    // 1. Scrape and save stories
    const result = await scrapeSource(source);
    console.log("Scrape completed:", result);

    // 2. Connect scraper worker -> ingestion queue
    // Pass the scraped source to the AI worker queue
    await ingestionQueue.add("process-news", {
      source: job.data.source 
    });

    return result;
  },
  {
    connection,
    concurrency: 1
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job.id} failed`, error.message);
});


process.on(
  "SIGTERM",
  async()=>{
  
   console.log(
   "Closing worker..."
   );
  
  
   await worker.close();
  
  
   process.exit(0);
  
  });

module.exports = worker;