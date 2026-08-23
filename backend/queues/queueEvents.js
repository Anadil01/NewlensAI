const { QueueEvents } = require("bullmq");

const connection =
require("./connection");


const scrapeEvents =
new QueueEvents(
  "scrape-jobs",
  {
    connection
  }
);


scrapeEvents.on(
  "completed",
  ({jobId})=>{

    console.log(
      `Scrape job completed: ${jobId}`
    );

  }
);


scrapeEvents.on(
  "failed",
  ({jobId, failedReason})=>{

    console.error(
      `Scrape job failed: ${jobId}`,
      failedReason
    );

  }
);


scrapeEvents.on(
  "stalled",
  ({jobId})=>{

    console.warn(
      `Job stalled: ${jobId}`
    );

  }
);


module.exports =
scrapeEvents;