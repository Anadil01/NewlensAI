from config.sources.hackernews import hackernews_source
from config.sources.newsapi import newsapi_source
from config.sources.failing_test import failing_source

SOURCES = [

    hackernews_source,
    newsapi_source,
    failing_source

]


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