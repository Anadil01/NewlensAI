import sys
import unittest
from pathlib import Path
from unittest.mock import patch

INGESTION_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(INGESTION_DIR))

from scrapers.rss_scraper import scrape_rss_feed


class RssScraperTests(unittest.TestCase):
    @patch("scrapers.rss_scraper.requests.get")
    def test_normalizes_rss_items(self, mock_get):
        mock_get.return_value.content = b"""<rss><channel><item>
          <title>Example headline</title><link>https://example.com/story</link>
          <description>Example excerpt</description><pubDate>Tue, 01 Sep 2026 12:00:00 GMT</pubDate>
        </item></channel></rss>"""
        mock_get.return_value.raise_for_status.return_value = None

        stories = scrape_rss_feed("https://example.com/feed", "Example", limit=1)

        self.assertEqual(stories[0]["title"], "Example headline")
        self.assertEqual(stories[0]["canonical_url"], "https://example.com/story")
        self.assertIsNotNone(stories[0]["external_id"])


if __name__ == "__main__":
    unittest.main()
