const getIngestionQueue = () =>
  require("../queues/ingestionQueue");

const enqueueIngestion = async (triggeredBy) => {
  const ingestionQueue = getIngestionQueue();

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