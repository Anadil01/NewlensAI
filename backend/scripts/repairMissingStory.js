const prisma = require("../utils/prisma");

const {
  elasticsearchClient
} = require("../utils/elasticsearch");

const {
  indexStory
} = require("../services/searchService");

const STORY_ID =
  "4e3ded78-de81-42df-ab67-85ff1999004f";

const main = async () => {
  const story = await prisma.story.findUnique({
    where: {
      id: STORY_ID
    }
  });

  if (!story) {
    throw new Error(
      "Story not found in PostgreSQL"
    );
  }

  console.log(
    "Found story:",
    story.title
  );

  await indexStory(story);

  console.log(
    "Story indexed successfully"
  );

  await prisma.$disconnect();
  await elasticsearchClient.close();
};

main().catch(async (error) => {
  console.error(
    "Repair failed:",
    error
  );

  await prisma.$disconnect();

  process.exit(1);
});