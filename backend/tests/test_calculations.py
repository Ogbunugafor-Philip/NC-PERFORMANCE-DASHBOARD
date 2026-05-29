"""KPI calculation unit tests — no database required."""
from datetime import date

import pytest

from app.services.calculation_engine import KPICalculator

calc = KPICalculator()


# ── invalid count ────────────────────────────────────────────────────────────

def test_invalid_count():
    assert calc.calculate_invalid_count(80, 70) == 10
    assert calc.calculate_invalid_count(0, 0) == 0
    assert calc.calculate_invalid_count(100, 100) == 0


# ── percentage invalid ───────────────────────────────────────────────────────

def test_percentage_invalid():
    assert calc.calculate_percentage_invalid(10, 80) == 13   # 12.5 → rounds up
    assert calc.calculate_percentage_invalid(0, 0) == 0      # zero-division safe
    assert calc.calculate_percentage_invalid(0, 80) == 0
    assert calc.calculate_percentage_invalid(80, 80) == 100


# ── percentage achievement ───────────────────────────────────────────────────

def test_percentage_achievement():
    assert calc.calculate_percentage_achievement(70, 100) == 70
    assert calc.calculate_percentage_achievement(120, 100) == 120   # raw — no cap here
    assert calc.calculate_percentage_achievement(0, 0) == 0          # zero-division safe
    assert calc.calculate_percentage_achievement(50, 50) == 100


# ── scorecard ────────────────────────────────────────────────────────────────

def test_scorecard():
    # 120 capped to 100 → 50pts; 60% → 30pts = 80
    assert calc.calculate_final_scorecard(120, 60) == 80
    assert calc.calculate_final_scorecard(100, 100) == 100
    assert calc.calculate_final_scorecard(80, 60) == 70
    assert calc.calculate_final_scorecard(0, 0) == 0
    # Both at 50%
    assert calc.calculate_final_scorecard(50, 50) == 50


# ── daily run rate ───────────────────────────────────────────────────────────

def test_drr():
    # Day 15 of May 2025 (31-day month, 16 days remaining)
    d = date(2025, 5, 15)

    # current DRR: 150 valid ÷ 15 days elapsed = 10
    assert calc.calculate_current_daily_run_rate(150, d) == 10
    assert calc.calculate_current_daily_run_rate(0, d) == 0

    # required DRR: 160 outstanding ÷ 16 days remaining = 10
    assert calc.calculate_required_daily_run_rate(160, d) == 10

    # Last day of month → 0 days remaining → safe return 0
    d_last = date(2025, 5, 31)
    assert calc.calculate_required_daily_run_rate(100, d_last) == 0

    # Target already met (outstanding ≤ 0) → 0
    assert calc.calculate_required_daily_run_rate(0, d) == 0
    assert calc.calculate_required_daily_run_rate(-5, d) == 0


# ── rounding (ROUND_HALF_UP) ─────────────────────────────────────────────────

def test_rounding():
    assert calc._round(4.76) == 5
    assert calc._round(16.67) == 17
    assert calc._round(12.31) == 12
    # Half-up behaviour: .5 rounds away from zero
    assert calc._round(0.5) == 1
    assert calc._round(2.5) == 3
