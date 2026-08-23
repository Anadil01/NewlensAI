const { Queue } = require("bullmq");

const connection =
require("./connection");


const scrapeQueue =
new Queue(
  "scrape-jobs",
  {
    connection,

    defaultJobOptions:{
      
      attempts:3,

      backoff:{
        type:"exponential",
        delay:5000
      },

      removeOnComplete:true,

      removeOnFail:false
    }
  }
);


module.exports =
scrapeQueue;