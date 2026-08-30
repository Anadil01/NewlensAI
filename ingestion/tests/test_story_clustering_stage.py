import sys
import unittest
from pathlib import Path
from unittest.mock import patch

INGESTION_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(INGESTION_DIR))

from clustering.story_clusterer import StoryClusterer
from services.story_clustering_service import cluster_stories


class StubClusterer:
    def __init__(self, groups):
        self.groups = groups

    def cluster(self, stories):
        return self.groups


class StoryClusteringStageTests(unittest.TestCase):
    def test_clusterer_groups_related_stories_and_respects_time_window(self):
        stories = [
            {"id": "a", "title": "OpenAI releases a new model", "content": "model launch", "entities": ["OpenAI"], "published_at": "2026-08-01T10:00:00Z"},
            {"id": "b", "title": "OpenAI launches new model", "content": "model launch", "entities": ["OpenAI"], "published_at": "2026-08-02T10:00:00Z"},
            {"id": "c", "title": "OpenAI launches new model", "content": "model launch", "entities": ["OpenAI"], "published_at": "2026-08-10T10:00:00Z"},
        ]
        with patch("clustering.story_clusterer.generate_embeddings", return_value=[[1.0, 0.0]] * 3):
            clusters = StoryClusterer(threshold=0.6).cluster(stories)
        self.assertEqual(clusters, [["a", "b"]])

    @patch("services.story_clustering_service.create_cluster_with_stories")
    @patch("services.story_clustering_service.get_stories_for_clustering")
    def test_stage_persists_clusters_and_reports_pipeline_success(self, mock_fetch, mock_create):
        mock_fetch.return_value = [
            {"id": "a", "title": "Representative headline", "content": "x" * 100},
            {"id": "b", "title": "Related headline", "content": "x" * 100},
        ]
        mock_create.return_value = "cluster-1"
        results = cluster_stories(clusterer=StubClusterer([["a", "b"]]))
        self.assertEqual(results, [{"success": True, "cluster_id": "cluster-1", "stories": ["a", "b"]}])
        mock_create.assert_called_once_with(title="Representative headline", description="Automatically generated story cluster", story_ids=["a", "b"])

    @patch("services.story_clustering_service.create_cluster_with_stories")
    @patch("services.story_clustering_service.get_stories_for_clustering")
    def test_stage_continues_when_one_group_cannot_be_persisted(self, mock_fetch, mock_create):
        mock_fetch.return_value = [{"id": value, "title": value, "content": "x" * 100} for value in ("a", "b", "c", "d")]
        mock_create.side_effect = [RuntimeError("conflict"), "cluster-2"]
        results = cluster_stories(clusterer=StubClusterer([["a", "b"], ["c", "d"]]))
        self.assertEqual([result["success"] for result in results], [False, True])
        self.assertEqual(results[0]["error"], "conflict")
        self.assertEqual(results[1]["cluster_id"], "cluster-2")


if __name__ == "__main__":
    unittest.main()
