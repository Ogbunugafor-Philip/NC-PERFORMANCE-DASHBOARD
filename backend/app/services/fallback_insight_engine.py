class FallbackInsightEngine:
    def generate_fso_insight(self, fso_data: dict) -> str:
        name = fso_data["name"]
        ind_achievement = fso_data["ind_achievement"]
        bus_achievement = fso_data["bus_achievement"]
        overall = (ind_achievement + bus_achievement) // 2
        ind_current_drr = fso_data["ind_current_drr"]
        ind_required_drr = fso_data["ind_required_drr"]
        bus_current_drr = fso_data["bus_current_drr"]
        bus_required_drr = fso_data["bus_required_drr"]
        ind_valid = fso_data["ind_valid"]
        bus_valid = fso_data["bus_valid"]
        scorecard = fso_data["scorecard"]
        rank = fso_data["rank"]
        total_fsos = fso_data["total_fsos"]
        weakest_kpi = "Individual accounts" if ind_achievement <= bus_achievement else "Business accounts"
        required_drr = ind_required_drr if ind_achievement <= bus_achievement else bus_required_drr
        current_drr = ind_current_drr if ind_achievement <= bus_achievement else bus_current_drr

        if overall >= 100:
            return (
                f"Excellent work, {name}! You have met your target with {ind_valid} individual "
                f"and {bus_valid} business valid accounts, placing you {rank} out of {total_fsos} FSOs "
                f"with a scorecard of {scorecard}/100. Keep maintaining this outstanding pace to stay ahead "
                f"and support colleagues who need it."
            )
        if overall >= 80 and current_drr >= required_drr:
            return (
                f"{name}, you are on track with {overall}% overall achievement and a scorecard of "
                f"{scorecard}/100, ranked {rank} out of {total_fsos} FSOs. Your daily run rate is "
                f"meeting the required pace — maintain this consistency and focus on quality to "
                f"close out the month strong."
            )
        if overall >= 80 and current_drr < required_drr:
            return (
                f"{name}, your achievement is at {overall}% which is strong, but your daily pace has "
                f"slowed recently. You need {required_drr} accounts/day but are currently delivering "
                f"{current_drr} — pick up the pace in your {weakest_kpi.lower()} to protect your "
                f"{scorecard}/100 scorecard and current rank of {rank}/{total_fsos}."
            )
        if overall >= 50:
            return (
                f"{name}, you are at {overall}% achievement which puts you at risk of missing your "
                f"target (scorecard: {scorecard}/100, rank: {rank}/{total_fsos}). Focus on "
                f"{weakest_kpi} — your biggest gap — where you need {required_drr} accounts/day "
                f"for the remaining days. Consistent daily effort is key to closing this gap."
            )
        return (
            f"{name}, urgent attention is needed. At {overall}% achievement you are critically behind "
            f"target (scorecard: {scorecard}/100, rank: {rank}/{total_fsos}). You need {required_drr} "
            f"accounts/day for {weakest_kpi.lower()} — significantly above your current rate of "
            f"{current_drr}. Please speak with your Cluster Head immediately to plan a daily action."
        )

    def generate_cluster_head_insight(self, cluster_data: dict) -> str:
        name = cluster_data["name"]
        team_scorecard = cluster_data["team_scorecard"]
        ind_achievement = cluster_data["ind_achievement"]
        bus_achievement = cluster_data["bus_achievement"]
        overall = (ind_achievement + bus_achievement) // 2
        cluster_rank = cluster_data["cluster_rank"]
        total_clusters = cluster_data["total_clusters"]
        total_fsos = cluster_data["total_fsos"]
        bottom_name = cluster_data["bottom_performer_name"]
        bottom_score = cluster_data["bottom_performer_score"]
        top_name = cluster_data["top_performer_name"]
        ind_current_drr = cluster_data["ind_current_drr"]
        ind_required_drr = cluster_data["ind_required_drr"]

        if overall >= 80:
            return (
                f"{name}, your team is performing strongly with a {team_scorecard}/100 scorecard "
                f"(ranked {cluster_rank}/{total_clusters} cluster heads) and {overall}% overall achievement "
                f"across {total_fsos} FSOs. {top_name} is your standout performer — leverage their "
                f"approach as a model for the team. Continue daily check-ins to maintain momentum "
                f"and support {bottom_name} (score: {bottom_score}) who needs targeted coaching."
            )
        if overall >= 50:
            return (
                f"{name}, your team scorecard stands at {team_scorecard}/100 ({cluster_rank}/{total_clusters}) "
                f"with {overall}% achievement across {total_fsos} FSOs — there is meaningful room for "
                f"improvement. Your team's daily run rate of {ind_current_drr} needs to reach "
                f"{ind_required_drr} for individual accounts. Prioritise a coaching session with "
                f"{bottom_name} (score: {bottom_score}) and have {top_name} share best practices "
                f"in your next team huddle."
            )
        return (
            f"{name}, your team is critically behind target — scorecard {team_scorecard}/100, "
            f"ranked {cluster_rank}/{total_clusters}, with only {overall}% achievement. Immediate "
            f"action is required: hold a team meeting today, review each FSO's pipeline, and provide "
            f"urgent support to {bottom_name} (score: {bottom_score}). Daily run rate must reach "
            f"{ind_required_drr} accounts/day from the current {ind_current_drr} to recover."
        )

    def generate_rsm_insight(self, regional_data: dict) -> str:
        regional_scorecard = regional_data["regional_scorecard"]
        ind_achievement = regional_data["ind_achievement"]
        bus_achievement = regional_data["bus_achievement"]
        overall = (ind_achievement + bus_achievement) // 2
        total_fsos = regional_data["total_fsos"]
        total_clusters = regional_data["total_clusters"]
        critical_count = regional_data["critical_count"]
        on_track_count = regional_data["on_track_count"]
        top_cluster = regional_data["top_cluster_name"]
        top_cluster_score = regional_data["top_cluster_score"]
        bottom_cluster = regional_data["bottom_cluster_name"]
        bottom_cluster_score = regional_data["bottom_cluster_score"]
        top_fso = regional_data["top_fso_name"]

        risk_note = ""
        if critical_count > 0:
            risk_note = (
                f" {critical_count} FSO{'s are' if critical_count > 1 else ' is'} critically behind "
                f"(below 50% achievement) and require immediate intervention."
            )

        if overall >= 80:
            return (
                f"North Central Region is performing well with a {regional_scorecard}/100 regional "
                f"scorecard and {overall}% combined achievement across {total_fsos} FSOs and "
                f"{total_clusters} clusters. {top_cluster} leads with a {top_cluster_score} scorecard "
                f"and {top_fso} is the top FSO.{risk_note} Recommended actions: (1) Spotlight top "
                f"performers in the weekly briefing to build morale; (2) Deploy targeted support to "
                f"{bottom_cluster} (score: {bottom_cluster_score}) before month-end."
            )
        if overall >= 50:
            return (
                f"North Central Region is at risk with a {regional_scorecard}/100 scorecard and "
                f"{overall}% achievement — {on_track_count} of {total_fsos} FSOs are on track.{risk_note} "
                f"{bottom_cluster} (score: {bottom_cluster_score}) is your biggest cluster risk. "
                f"Recommended actions: (1) Urgent review meeting with {bottom_cluster}'s Cluster Head "
                f"to identify blockers; (2) Increase daily reporting cadence to track DRR recovery "
                f"across all clusters this week."
            )
        return (
            f"North Central Region is critically off-target: {regional_scorecard}/100 scorecard, "
            f"{overall}% achievement, with {critical_count} FSOs in critical status.{risk_note} "
            f"Only {on_track_count} of {total_fsos} FSOs are on track. Recommended actions: "
            f"(1) Escalate to leadership and convene an emergency cluster heads meeting within 24 hours; "
            f"(2) Implement daily pipeline reviews for all FSOs below 50% achievement, led personally "
            f"by their Cluster Heads."
        )
