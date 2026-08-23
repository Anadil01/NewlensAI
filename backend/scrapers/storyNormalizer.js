const normalizeStory = ({
    externalId,
    title,
    url,
    author = null,
    points = null,
    publishedAt = null,
    content = null,
    excerpt = null
  }) => {
    return {
      externalId,
      canonicalUrl: url,
      title: title.trim(),
      author,
      points,
      publishedAt,
      content,
      excerpt
    };
  };
  
  module.exports = {
    normalizeStory
  };