const hackerNewsSource =
  require("./hackerNews");

const sources = [
  hackerNewsSource
];

const getSourceBySlug = (slug) => {
  return sources.find(
    (source) => source.slug === slug
  );
};

module.exports = {
  sources,
  getSourceBySlug
};