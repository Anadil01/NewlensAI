from config.sources.hackernews import hackernews_source
from config.sources.newsapi import newsapi_source
from config.sources.failing_test import failing_source
from config.sources.rss import rss_sources

SOURCES = [

    hackernews_source,
    newsapi_source,
    *rss_sources,
    failing_source

]


def _validate_registry(sources):
    slugs = set()
    for source in sources:
        for field in ("slug", "name", "website_url", "type", "enabled", "scraper"):
            if field not in source:
                raise ValueError(f"Source is missing required field: {field}")
        if source["slug"] in slugs:
            raise ValueError(f"Duplicate source slug: {source['slug']}")
        if not callable(source["scraper"]):
            raise ValueError(f"Source scraper must be callable: {source['slug']}")
        slugs.add(source["slug"])


_validate_registry(SOURCES)


def get_active_sources():

    return [
        source
        for source in SOURCES
        if source.get("enabled")
    ]


def get_source_by_slug(slug):

    return next(
        (
            source
            for source in SOURCES
            if source["slug"] == slug
        ),
        None
    )
