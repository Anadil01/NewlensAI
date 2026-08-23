const {
    fetchHackerNewsHomepage
  } = require("../integrations/news/hackerNewsClient");
  
  const run = async () => {
    try {
      const html =
        await fetchHackerNewsHomepage();
  
      console.log(
        "Hacker News HTML fetched successfully"
      );
  
      console.log(
        "HTML length:",
        html.length
      );
    } catch (error) {
      console.error(
        "Hacker News request failed:",
        error.message
      );
    }
  };
  
  run();