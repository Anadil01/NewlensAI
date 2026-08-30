import sys
import unittest
from pathlib import Path
from unittest.mock import patch


INGESTION_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(INGESTION_DIR))

from services.ingestion_pipeline import run_ingestion_pipeline, run_stage_with_retries


class IngestionPipelineTests(unittest.TestCase):
    @patch("services.ingestion_pipeline.time.sleep")
    def test_stage_retries_transient_failure(self, mock_sleep):
        calls = []

        def transient_stage(_limit):
            calls.append(1)
            if len(calls) == 1:
                raise RuntimeError("temporary outage")
            return [{"success": True}]

        result, attempts = run_stage_with_retries("test", transient_stage, 10)

        self.assertEqual(result, [{"success": True}])
        self.assertEqual(attempts, 2)
        mock_sleep.assert_called_once()

    @patch("services.ingestion_pipeline.analyze_story_bias")
    @patch("services.ingestion_pipeline.cluster_stories")
    @patch("services.ingestion_pipeline.classify_stories")
    @patch("services.ingestion_pipeline.summarize_stories")
    @patch("services.ingestion_pipeline.extract_content_for_stories")
    @patch("services.ingestion_pipeline.run_all_sources")
    def test_sources_run_before_downstream_enrichment(
        self,
        mock_sources,
        mock_extract,
        mock_summarize,
        mock_topics,
        mock_clusters,
        mock_bias,
    ):
        call_order = []

        mock_sources.side_effect = lambda: call_order.append("sources") or {
            "results": [{"source": "hacker-news", "success": True}]
        }
        for name, mock in (
            ("extraction", mock_extract),
            ("summaries", mock_summarize),
            ("topics", mock_topics),
            ("clusters", mock_clusters),
            ("bias", mock_bias),
        ):
            mock.side_effect = lambda _limit, name=name: call_order.append(name) or []

        result = run_ingestion_pipeline(limit=7)

        self.assertEqual(
            call_order,
            ["sources", "extraction", "summaries", "topics", "clusters", "bias"],
        )
        self.assertEqual(result["sources"], [{"source": "hacker-news", "success": True}])
        self.assertEqual(result["metrics"]["stages"]["sources"]["successful"], 1)
        mock_extract.assert_called_once_with(7)


if __name__ == "__main__":
    unittest.main()
