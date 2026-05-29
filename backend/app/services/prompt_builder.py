class PromptBuilder:
    def build_fso_prompt(self, fso_data: dict) -> str:
        return (
            "You are a performance coach for Sterling Bank North Central region. "
            "Analyze this FSO's performance data and provide a helpful, motivating insight "
            "in 3-4 sentences. Be specific, use the actual numbers, and give one clear actionable recommendation.\n\n"
            f"FSO Name: {fso_data['name']}\n"
            f"Report Date: {fso_data['report_date']}\n\n"
            "INDIVIDUAL ACCOUNTS:\n"
            f"- Target: {fso_data['ind_target']} | Valid: {fso_data['ind_valid']} | Achievement: {fso_data['ind_achievement']}%\n"
            f"- Current Daily Run Rate: {fso_data['ind_current_drr']} accounts/day\n"
            f"- Required Daily Run Rate: {fso_data['ind_required_drr']} accounts/day\n"
            f"- Status: {fso_data['ind_status']}\n\n"
            "BUSINESS ACCOUNTS:\n"
            f"- Target: {fso_data['bus_target']} | Valid: {fso_data['bus_valid']} | Achievement: {fso_data['bus_achievement']}%\n"
            f"- Current Daily Run Rate: {fso_data['bus_current_drr']} accounts/day\n"
            f"- Required Daily Run Rate: {fso_data['bus_required_drr']} accounts/day\n"
            f"- Status: {fso_data['bus_status']}\n\n"
            f"SCORECARD: {fso_data['scorecard']}/100\n"
            f"REGIONAL RANKING: {fso_data['rank']} out of {fso_data['total_fsos']} FSOs\n\n"
            "Provide a performance insight that:\n"
            "1. Acknowledges what is going well\n"
            "2. Identifies the biggest gap\n"
            "3. Gives one specific daily action to improve\n"
            "Keep it encouraging, professional, and under 100 words."
        )

    def build_cluster_head_prompt(self, cluster_data: dict) -> str:
        return (
            "You are a regional performance manager for Sterling Bank. "
            "Analyze this Cluster Head's team performance and provide a management insight in 3-4 sentences.\n\n"
            f"Cluster Head: {cluster_data['name']}\n"
            f"Team Size: {cluster_data['total_fsos']} FSOs\n"
            f"Report Date: {cluster_data['report_date']}\n\n"
            "TEAM INDIVIDUAL ACCOUNTS:\n"
            f"- Total Target: {cluster_data['total_ind_target']} | Total Valid: {cluster_data['total_ind_valid']}\n"
            f"- Team Achievement: {cluster_data['ind_achievement']}%\n"
            f"- Team Daily Run Rate: {cluster_data['ind_current_drr']} | Required: {cluster_data['ind_required_drr']}\n\n"
            "TEAM BUSINESS ACCOUNTS:\n"
            f"- Total Target: {cluster_data['total_bus_target']} | Total Valid: {cluster_data['total_bus_valid']}\n"
            f"- Team Achievement: {cluster_data['bus_achievement']}%\n"
            f"- Team Daily Run Rate: {cluster_data['bus_current_drr']} | Required: {cluster_data['bus_required_drr']}\n\n"
            f"TEAM SCORECARD: {cluster_data['team_scorecard']}/100\n"
            f"CLUSTER RANKING: {cluster_data['cluster_rank']} out of {cluster_data['total_clusters']} Cluster Heads\n\n"
            f"TOP PERFORMER: {cluster_data['top_performer_name']} (Scorecard: {cluster_data['top_performer_score']})\n"
            f"NEEDS ATTENTION: {cluster_data['bottom_performer_name']} (Scorecard: {cluster_data['bottom_performer_score']})\n\n"
            "Provide a team management insight that:\n"
            "1. Summarizes team performance honestly\n"
            "2. Highlights the FSO needing most support\n"
            "3. Gives one specific team coaching action\n"
            "Keep it direct, managerial, and under 120 words."
        )

    def build_rsm_prompt(self, regional_data: dict) -> str:
        return (
            "You are the Regional Sales Director for Sterling Bank North Central. "
            "Analyze the regional performance data and provide an executive insight.\n\n"
            f"Report Date: {regional_data['report_date']}\n"
            f"Total FSOs: {regional_data['total_fsos']}\n"
            f"Total Cluster Heads: {regional_data['total_clusters']}\n\n"
            "REGIONAL INDIVIDUAL ACCOUNTS:\n"
            f"- Total Target: {regional_data['total_ind_target']} | Total Valid: {regional_data['total_ind_valid']}\n"
            f"- Regional Achievement: {regional_data['ind_achievement']}%\n\n"
            "REGIONAL BUSINESS ACCOUNTS:\n"
            f"- Total Target: {regional_data['total_bus_target']} | Total Valid: {regional_data['total_bus_valid']}\n"
            f"- Regional Achievement: {regional_data['bus_achievement']}%\n\n"
            f"REGIONAL SCORECARD: {regional_data['regional_scorecard']}/100\n\n"
            f"TOP CLUSTER HEAD: {regional_data['top_cluster_name']} (Scorecard: {regional_data['top_cluster_score']})\n"
            f"LOWEST CLUSTER HEAD: {regional_data['bottom_cluster_name']} (Scorecard: {regional_data['bottom_cluster_score']})\n"
            f"TOP FSO: {regional_data['top_fso_name']} (Scorecard: {regional_data['top_fso_score']})\n"
            f"FSOs AT CRITICAL (<50%): {regional_data['critical_count']}\n"
            f"FSOs ON TRACK (>=80%): {regional_data['on_track_count']}\n\n"
            "Provide a regional executive insight that:\n"
            "1. States the regional performance position clearly\n"
            "2. Identifies the 1-2 biggest regional risks\n"
            "3. Recommends 2 specific management actions\n"
            "Keep it executive-level, data-driven, and under 150 words."
        )

    def build_admin_prompt(self, admin_data: dict) -> str:
        base = self.build_rsm_prompt(admin_data)
        extra = (
            f"\n\nDATA QUALITY:\n"
            f"- Unmatched DAO codes in last upload: {admin_data.get('unmatched_count', 0)}\n"
            f"- Missing rank records: {admin_data.get('missing_rank_count', 0)}\n"
            f"- Validation status: {admin_data.get('validation_status', 'N/A')}\n\n"
            "Also note any data quality concerns and whether a recalculation is recommended. "
            "Keep the full response under 180 words."
        )
        return base + extra
