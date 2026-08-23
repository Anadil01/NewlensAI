const {
    getSourceBySlug
  } = require("../config/sources");
  
  const run = async () => {
    const source =
      getSourceBySlug("hacker-news");
  
    if (!source) {
      throw new Error(
        "Hacker News source not found"
      );
    }
  
    console.log(
      "Source configuration:"
    );
  
    console.log({
      slug: source.slug,
      name: source.name,
      websiteUrl: source.websiteUrl,
      type: source.type
    });
  
    const stories =
      await source.scraper();
  
    console.log(
      `Stories fetched through source registry: ${stories.length}`
    );
  };
  
  run().catch((error) => {
    console.error(
      "Source registry test failed:",
      error.message
    );
  
    process.exit(1);
  });