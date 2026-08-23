const prisma = require("../utils/prisma");

const {
  indexStory
} = require("./searchService");

const saveStory = async ({
  sourceId,
  story
}) => {
  const existingStory =
    await prisma.story.findUnique({
      where: {
        sourceId_externalId: {
          sourceId,
          externalId: story.externalId
        }
      }
    });

  if (existingStory) {
    const updatedStory =
      await prisma.story.update({
        where: {
          id: existingStory.id
        },
        data: {
          canonicalUrl: story.canonicalUrl,
          title: story.title,
          author: story.author,
          points: story.points,
          publishedAt: story.publishedAt,
          content: story.content,
          excerpt: story.excerpt
        }
      });

    await indexStory(updatedStory);

    return {
      action: "updated",
      story: updatedStory
    };
  }

  const createdStory =
    await prisma.story.create({
      data: {
        sourceId,
        externalId: story.externalId,
        canonicalUrl: story.canonicalUrl,
        title: story.title,
        author: story.author,
        points: story.points,
        publishedAt: story.publishedAt,
        content: story.content,
        excerpt: story.excerpt,
        contentStatus: "EXTERNAL_ONLY"
      }
    });

  await indexStory(createdStory);

  return {
    action: "inserted",
    story: createdStory
  };
};

module.exports = {
  saveStory
};