import calendar
from datetime import date
from decimal import Decimal, ROUND_HALF_UP


class KPICalculator:
    @staticmethod
    def _round(value: float) -> int:
        return int(Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    def calculate_invalid_count(self, actual: int, valid: int) -> int:
        return actual - valid

    def calculate_percentage_invalid(self, invalid_count: int, actual: int) -> int:
        if actual == 0:
            return 0
        return self._round((invalid_count / actual) * 100)

    def calculate_percentage_achievement(self, valid: int, target: int) -> int:
        if target == 0:
            return 0
        return self._round((valid / target) * 100)

    def calculate_accounts_outstanding(self, target: int, valid: int) -> int:
        return target - valid

    def calculate_current_daily_run_rate(self, valid: int, report_date: date) -> int:
        days_elapsed = report_date.day
        if days_elapsed == 0:
            return 0
        return self._round(valid / days_elapsed)

    def calculate_required_daily_run_rate(self, outstanding: int, report_date: date) -> int:
        last_day = calendar.monthrange(report_date.year, report_date.month)[1]
        days_remaining = last_day - report_date.day
        if days_remaining == 0 or outstanding <= 0:
            return 0
        return self._round(outstanding / days_remaining)

    def calculate_scorecard_component(self, percentage_achievement: int) -> float:
        return min(percentage_achievement, 100) * 0.5

    def calculate_final_scorecard(self, ind_achievement: int, bus_achievement: int) -> int:
        return self._round(
            self.calculate_scorecard_component(ind_achievement)
            + self.calculate_scorecard_component(bus_achievement)
        )
