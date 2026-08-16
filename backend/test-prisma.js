const prisma = require("./utils/prisma");

async function testTransaction() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const source = await tx.source.upsert({
        where: {
          slug: "transaction-test-source"
        },
        update: {},
        create: {
          name: "Transaction Test Source",
          slug: "transaction-test-source",
          websiteUrl: "https://example.com",
          type: "WEBSITE"
        }
      });

      const story = await tx.story.create({
        data: {
          sourceId: source.id,
          externalId: `transaction-test-${Date.now()}`,
          canonicalUrl: "https://example.com/transaction-test",
          title: "Transaction Test Story",
          author: "Anadil",
          content: "Testing Prisma transactions.",
          excerpt: "Transaction test.",
          contentStatus: "FULL",
          publishedAt: new Date()
        }
      });

      return {
        source,
        story
      };
    });

    console.log("Transaction successful:");
    console.dir(result, { depth: null });

  } catch (error) {
    console.error("Transaction failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testTransaction();