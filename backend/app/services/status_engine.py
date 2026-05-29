class StatusEngine:
    def get_performance_status(self, percentage_achievement: int) -> str:
        if percentage_achievement >= 100:
            return "TARGET MET"
        if percentage_achievement >= 80:
            return "ON TRACK"
        if percentage_achievement >= 50:
            return "AT RISK"
        return "CRITICAL"

    def get_drr_status(self, current_drr: int, required_drr: int) -> str:
        if current_drr >= required_drr:
            return "AHEAD OF PACE"
        if current_drr >= required_drr * 0.8:
            return "CLOSE TO PACE"
        return "BEHIND PACE"

    def get_scorecard_grade(self, scorecard: int) -> str:
        if scorecard >= 90:
            return "Excellent"
        if scorecard >= 70:
            return "Good"
        if scorecard >= 50:
            return "Average"
        return "Below Average"
