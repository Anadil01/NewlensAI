const scrapeQueue = require("../queues/scrapeQueue");


const startScheduler = async () => {

  await scrapeQueue.add(
    "hacker-news-scrape",

    {
      source:"hacker-news"
    },

    {
      repeat:{
        every:
        60 * 60 * 1000
      },

      jobId:
      "hacker-news-hourly-scrape"
    }

  );


  console.log(
    "Scrape scheduler started"
  );

};


module.exports =
startScheduler;