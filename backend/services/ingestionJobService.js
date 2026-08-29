const ingestionQueue = require("../queues/ingestionQueue");

const enqueueIngestion = async (triggeredBy) => {
  const job = await ingestionQueue.add(
    "run-ingestion",
    {
      source: "all",
      triggeredBy,
    }
  );

  return {
    jobId: job.id,
    status: "queued",
  };
};

module.exports = {
  enqueueIngestion,
};