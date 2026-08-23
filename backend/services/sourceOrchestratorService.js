const {
  sources
} = require("../config/sources");

const {
  scrapeSource
} = require("./sourceScraperService");

const runAllSourceScrapers = async () => {
  const results =
    await Promise.allSettled(
      sources.map(async (source) => {

        const result =
          await scrapeSource(source);

        return {
          source: source.slug,
          success: true,
          ...result
        };
      })
    );

  return results.map((result, index) => {
    const source = sources[index];

    if (result.status === "fulfilled") {
      return result.value;
    }

    console.error(
      `Source scrape failed: ${source.name}`,
      result.reason?.message
    );

    return {
      source: source.slug,
      success: false,
      error:
        result.reason?.message ||
        "Unknown scraper error"
    };
  });
};

module.exports = {
  runAllSourceScrapers
};