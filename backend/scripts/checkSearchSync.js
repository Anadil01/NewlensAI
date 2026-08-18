const prisma = require("../utils/prisma");

const {
  elasticsearchClient
} = require("../utils/elasticsearch");

const {
  STORIES_INDEX
} = require("../services/searchIndexService");

const main = async () => {
  const stories = await prisma.story.findMany({
    select: {
      id: true,
      title: true
    }
  });

  const response =
    await elasticsearchClient.search({
      index: STORIES_INDEX,
      size: 10000,
      query: {
        match_all: {}
      },
      _source: [
        "id",
        "title"
      ]
    });

  const elasticIds = new Set(
    response.hits.hits.map(
      (hit) => hit._id
    )
  );

  const missingStories =
    stories.filter(
      (story) => !elasticIds.has(story.id)
    );

  console.log(
    `PostgreSQL stories: ${stories.length}`
  );

  console.log(
    `Elasticsearch stories: ${response.hits.hits.length}`
  );

  console.log(
    `Missing from Elasticsearch: ${missingStories.length}`
  );

  if (missingStories.length > 0) {
    console.log(
      "Missing stories:"
    );

    console.table(
      missingStories
    );
  } else {
    console.log(
      "PostgreSQL and Elasticsearch are synchronized."
    );
  }

  await prisma.$disconnect();
  await elasticsearchClient.close();
};

main().catch(async (error) => {
  console.error(
    "Sync check failed:",
    error
  );

  await prisma.$disconnect();

  process.exit(1);
});