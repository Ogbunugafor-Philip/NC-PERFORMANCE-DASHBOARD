"""Ranking and ordinal-suffix unit tests — no database required."""
import pytest

from app.services.calculation_engine import KPICalculator
from app.services.ranking_engine import get_fso_rank_display


# ── ordinal suffix ───────────────────────────────────────────────────────────

def test_ordinal_suffix():
    assert get_fso_rank_display(1) == "1st"
    assert get_fso_rank_display(2) == "2nd"
    assert get_fso_rank_display(3) == "3rd"
    assert get_fso_rank_display(4) == "4th"
    assert get_fso_rank_display(10) == "10th"
    assert get_fso_rank_display(11) == "11th"
    assert get_fso_rank_display(12) == "12th"
    assert get_fso_rank_display(13) == "13th"
    assert get_fso_rank_display(21) == "21st"
    assert get_fso_rank_display(22) == "22nd"
    assert get_fso_rank_display(23) == "23rd"
    assert get_fso_rank_display(100) == "100th"
    assert get_fso_rank_display(111) == "111th"   # teen override


# ── FSO ranking logic (in-memory) ────────────────────────────────────────────

def _apply_ranking(fsos: list[dict]) -> list[dict]:
    """Replicate FSORankingEngine.rank_active_report logic without a DB."""
    ranked = sorted(fsos, key=lambda x: (x["scorecard"], x["name"]), reverse=True)
    prev_score, prev_rank = None, 0
    for i, f in enumerate(ranked, start=1):
        if prev_score is not None and f["scorecard"] == prev_score:
            f["rank"] = prev_rank
        else:
            f["rank"] = i
            prev_rank = i
        prev_score = f["scorecard"]
    return ranked


def test_fso_ranking_order():
    fsos = [
        {"name": "Alice", "scorecard": 85},
        {"name": "Bob",   "scorecard": 90},
        {"name": "Carol", "scorecard": 85},   # tie with Alice → same rank
        {"name": "Dave",  "scorecard": 70},
    ]
    ranked = _apply_ranking(fsos)

    assert ranked[0]["name"] == "Bob"
    assert ranked[0]["rank"] == 1

    # Both 85-scorers get rank 2
    mid = [r for r in ranked if r["scorecard"] == 85]
    assert all(r["rank"] == 2 for r in mid)

    # Dave at 70 gets rank 4 (not 3, because ranks 2 and 3 were consumed by the tie)
    assert ranked[-1]["name"] == "Dave"
    assert ranked[-1]["rank"] == 4


def test_fso_ranking_all_tied():
    fsos = [{"name": f"FSO{i}", "scorecard": 80} for i in range(5)]
    ranked = _apply_ranking(fsos)
    assert all(r["rank"] == 1 for r in ranked)


# ── Cluster Head aggregation (pure math) ─────────────────────────────────────

def test_cluster_aggregation():
    calc = KPICalculator()
    team = [
        {"ind_target": 100, "ind_valid": 80, "bus_target": 50, "bus_valid": 40},
        {"ind_target": 100, "ind_valid": 90, "bus_target": 50, "bus_valid": 45},
        {"ind_target": 100, "ind_valid": 70, "bus_target": 50, "bus_valid": 35},
    ]
    total_ind_target = sum(f["ind_target"] for f in team)
    total_ind_valid  = sum(f["ind_valid"]  for f in team)
    total_bus_target = sum(f["bus_target"] for f in team)
    total_bus_valid  = sum(f["bus_valid"]  for f in team)

    assert total_ind_target == 300
    assert total_ind_valid  == 240
    assert total_bus_target == 150
    assert total_bus_valid  == 120

    ind_ach = calc.calculate_percentage_achievement(total_ind_valid, total_ind_target)
    bus_ach = calc.calculate_percentage_achievement(total_bus_valid, total_bus_target)

    assert ind_ach == 80   # 240/300
    assert bus_ach == 80   # 120/150

    team_scorecard = calc.calculate_final_scorecard(ind_ach, bus_ach)
    assert team_scorecard == 80   # 80*0.5 + 80*0.5


def test_cluster_aggregation_zero():
    calc = KPICalculator()
    ind_ach = calc.calculate_percentage_achievement(0, 0)
    bus_ach = calc.calculate_percentage_achievement(0, 0)
    assert calc.calculate_final_scorecard(ind_ach, bus_ach) == 0
