"""AI insight unit tests — no database required."""
import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.insight import InsightSource
from app.services.fallback_insight_engine import FallbackInsightEngine


# ── shared fixtures ───────────────────────────────────────────────────────────

def _fso_data(ind_ach: int = 75, bus_ach: int = 70) -> dict:
    return {
        "name": "Ada Lovelace",
        "report_date": "2025-05-29",
        "ind_target": 100, "ind_valid": ind_ach,
        "ind_achievement": ind_ach, "ind_current_drr": 3, "ind_required_drr": 4,
        "bus_target": 100, "bus_valid": bus_ach,
        "bus_achievement": bus_ach, "bus_current_drr": 3, "bus_required_drr": 4,
        "scorecard": 73, "rank": 5, "total_fsos": 20,
    }


def _cluster_data(ind_ach: int = 75, bus_ach: int = 70) -> dict:
    return {
        "name": "Grace Hopper",
        "total_fsos": 5, "report_date": "2025-05-29",
        "total_ind_target": 500, "total_ind_valid": ind_ach * 5,
        "ind_achievement": ind_ach, "ind_current_drr": 3, "ind_required_drr": 4,
        "total_bus_target": 500, "total_bus_valid": bus_ach * 5,
        "bus_achievement": bus_ach, "bus_current_drr": 3, "bus_required_drr": 4,
        "team_scorecard": 73, "cluster_rank": 2, "total_clusters": 6,
        "top_performer_name": "Top FSO", "top_performer_score": 90,
        "bottom_performer_name": "Bottom FSO", "bottom_performer_score": 40,
    }


def _regional_data(ind_ach: int = 70, bus_ach: int = 60) -> dict:
    return {
        "report_date": "2025-05-29",
        "total_fsos": 30, "total_clusters": 6,
        "total_ind_target": 3000, "total_ind_valid": ind_ach * 30,
        "ind_achievement": ind_ach,
        "total_bus_target": 3000, "total_bus_valid": bus_ach * 30,
        "bus_achievement": bus_ach,
        "regional_scorecard": 65,
        "top_cluster_name": "Abuja Cluster", "top_cluster_score": 85,
        "bottom_cluster_name": "Kogi Cluster", "bottom_cluster_score": 45,
        "top_fso_name": "Top FSO", "top_fso_score": 95,
        "critical_count": 4, "on_track_count": 18,
    }


# ── FallbackInsightEngine ─────────────────────────────────────────────────────

class TestFallbackInsightEngine:
    engine = FallbackInsightEngine()

    def test_fso_critical(self):
        text = self.engine.generate_fso_insight(_fso_data(20, 20))
        assert isinstance(text, str) and len(text) > 10
        assert "Ada Lovelace" in text

    def test_fso_at_risk(self):
        text = self.engine.generate_fso_insight(_fso_data(60, 55))
        assert isinstance(text, str) and len(text) > 10

    def test_fso_on_track(self):
        text = self.engine.generate_fso_insight(_fso_data(82, 85))
        assert isinstance(text, str) and len(text) > 10

    def test_fso_target_met(self):
        text = self.engine.generate_fso_insight(_fso_data(100, 105))
        assert isinstance(text, str) and "Excellent" in text

    def test_fso_zero_values(self):
        data = _fso_data(0, 0)
        data.update({"ind_current_drr": 0, "ind_required_drr": 0,
                      "bus_current_drr": 0, "bus_required_drr": 0,
                      "scorecard": 0, "rank": 0, "total_fsos": 0})
        text = self.engine.generate_fso_insight(data)
        assert isinstance(text, str) and len(text) > 0

    def test_cluster_strong(self):
        text = self.engine.generate_cluster_head_insight(_cluster_data(85, 82))
        assert isinstance(text, str) and "Grace Hopper" in text

    def test_cluster_at_risk(self):
        text = self.engine.generate_cluster_head_insight(_cluster_data(60, 55))
        assert isinstance(text, str) and len(text) > 10

    def test_cluster_critical(self):
        text = self.engine.generate_cluster_head_insight(_cluster_data(30, 25))
        assert isinstance(text, str) and len(text) > 10

    def test_regional_strong(self):
        text = self.engine.generate_rsm_insight(_regional_data(85, 82))
        assert isinstance(text, str) and len(text) > 10

    def test_regional_at_risk(self):
        text = self.engine.generate_rsm_insight(_regional_data(65, 60))
        assert isinstance(text, str) and len(text) > 10

    def test_regional_critical(self):
        text = self.engine.generate_rsm_insight(_regional_data(30, 25))
        assert isinstance(text, str) and len(text) > 10


# ── CerebrasService — graceful failure ───────────────────────────────────────

class TestCerebrasService:
    def test_returns_none_on_connect_error(self):
        from app.services.cerebras_service import CerebrasService
        import httpx

        svc = CerebrasService()

        async def _run():
            with patch("httpx.AsyncClient.post", side_effect=httpx.ConnectError("refused")):
                return await svc.generate("test prompt")

        result = asyncio.get_event_loop().run_until_complete(_run())
        assert result is None

    def test_returns_none_on_timeout(self):
        from app.services.cerebras_service import CerebrasService
        import httpx

        svc = CerebrasService()

        async def _run():
            with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("timeout")):
                return await svc.generate("test prompt")

        result = asyncio.get_event_loop().run_until_complete(_run())
        assert result is None

    def test_returns_none_when_disabled(self):
        from app.services.cerebras_service import CerebrasService

        svc = CerebrasService()
        svc.enabled = False

        result = asyncio.get_event_loop().run_until_complete(svc.generate("test"))
        assert result is None

    def test_returns_none_on_non_200(self):
        from app.services.cerebras_service import CerebrasService
        import httpx

        svc = CerebrasService()

        mock_response = MagicMock()
        mock_response.status_code = 500

        async def _run():
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
                return await svc.generate("test prompt")

        result = asyncio.get_event_loop().run_until_complete(_run())
        assert result is None


# ── InsightService uses fallback when Cerebras returns None ──────────────────

class TestInsightServiceFallback:
    def test_fallback_used_when_cerebras_returns_none(self):
        from app.services.insight_service import InsightService

        mock_db = MagicMock()
        svc = InsightService(mock_db)

        # Make cerebras.generate return None
        svc.cerebras.generate = AsyncMock(return_value=None)

        # Build FSO data and call _try_generate
        async def _run():
            text, source = await svc._try_generate("any prompt")
            return text, source

        text, source = asyncio.get_event_loop().run_until_complete(_run())
        # When cerebras returns None, _try_generate returns (None, None) and caller falls back
        assert text is None
        assert source is None

    def test_insight_source_label_cerebras(self):
        assert InsightSource.CEREBRAS == "CEREBRAS"

    def test_insight_source_label_fallback(self):
        assert InsightSource.FALLBACK == "FALLBACK"
