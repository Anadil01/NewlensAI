const path = require("path");
const { Worker } = require("bullmq");
const { execFile } = require("child_process");

const connection = require("../queues/connection");
const {
  invalidateStoryCaches
} = require("../services/storyCacheService");

// Absolute path to the Python ingestion project (a sibling of backend/).
const INGESTION_DIR = path.resolve(__dirname, "../../ingestion");

// Prefer the project virtualenv interpreter, which has the Python deps
// installed. Allow an override via the PYTHON_BIN env var.
const PYTHON_BIN =
  process.env.PYTHON_BIN ||
  path.join(INGESTION_DIR, "venv", "bin", "python3");

const PIPELINE_SCRIPT = path.join(INGESTION_DIR, "run_pipeline.py");

const runPipeline = () => new Promise((resolve, reject) => {
  execFile(
    PYTHON_BIN,
    [PIPELINE_SCRIPT],
    {
      cwd: INGESTION_DIR,
      // The pipeline prints per-story results; give it plenty of room
      // so a large batch doesn't blow the default 1MB stdout buffer.
      maxBuffer: 10 * 1024 * 1024
    },
    (error, stdout, stderr) => {
      if (stdout) {
        console.log(stdout);
      }

      if (stderr) {
        console.error(stderr);
      }

      if (error) {
        reject(error);
        return;
      }

      resolve();
    }
  );
});

const worker = new Worker(
  "ingestion-jobs",
  async (job) => {
    console.log("Running NewsLens AI pipeline");

    await runPipeline();

    try {
      await invalidateStoryCaches();
    } catch (error) {
      // The cache TTL is a safe fallback; do not retry the completed pipeline
      // merely because cache eviction was temporarily unavailable.
      console.error("Failed to invalidate story caches:", error.message);
    }

    return { success: true };
  },
  {
    connection,
    concurrency: 1
  }
);

worker.on("completed", (job) => {
  console.log("AI job completed", job.id);
});

worker.on("failed", (job, error) => {
  console.error("AI job failed", error.message);
});

module.exports = worker;
