import math
from typing import List, Dict, Any, Optional
from collections import defaultdict
import datetime
from app.schemas.schemas import (
    KPISummary,
    ParetoItem,
    ParetoAnalysisResponse,
    DefectTrendPoint,
    DefectTrendResponse,
    LineComparisonItem,
    MachinePerformanceItem,
    AnomalyItem
)

class QualityAnalyticsEngine:
    """
    Mathematical and statistical analytics engine for engineering quality inspection records.
    Computes KPIs, Pareto distributions, time-series aggregations, and process capability metrics.
    """

    @staticmethod
    def calculate_kpis(
        inspections: List[Dict[str, Any]],
        open_investigations_count: int = 0,
        normal_threshold: float = 2.0,
        warning_threshold: float = 5.0
    ) -> KPISummary:
        """
        Calculates executive quality KPIs from raw inspection records.
        """
        total_inspected = sum(r.get("units_inspected", 0) for r in inspections)
        total_defective = sum(r.get("defective_units", 0) for r in inspections)
        total_passed_first = sum(r.get("units_passed_first_inspection", max(0, r.get("units_inspected", 0) - r.get("defective_units", 0))) for r in inspections)

        # Defect Rate: (Total Defective / Total Inspected) * 100
        if total_inspected > 0:
            overall_defect_rate = round((total_defective / total_inspected) * 100.0, 2)
            first_pass_yield = round((total_passed_first / total_inspected) * 100.0, 2)
        else:
            overall_defect_rate = 0.0
            first_pass_yield = 100.0

        # Unique defect categories
        categories = set(
            r.get("defect_category") 
            for r in inspections 
            if r.get("defect_category") and r.get("defect_category") != "None" and r.get("defective_units", 0) > 0
        )

        # Threshold Status
        if overall_defect_rate > warning_threshold:
            threshold_status = "CRITICAL"
        elif overall_defect_rate > normal_threshold:
            threshold_status = "WARNING"
        else:
            threshold_status = "NORMAL"

        return KPISummary(
            total_inspected_units=total_inspected,
            total_defective_units=total_defective,
            overall_defect_rate=overall_defect_rate,
            first_pass_yield=first_pass_yield,
            fpy_available=True,
            total_inspections=len(inspections),
            number_of_defect_categories=len(categories),
            open_investigations=open_investigations_count,
            threshold_status=threshold_status,
            assumptions_note="FPY assumes units passing first inspection equals inspected minus defective units unless recorded explicitly."
        )

    @staticmethod
    def calculate_pareto(inspections: List[Dict[str, Any]]) -> ParetoAnalysisResponse:
        """
        Calculates Pareto ranking and cumulative distribution of defects.
        Identifies the 'vital few' categories contributing up to ~80% of total defects.
        """
        category_counts: Dict[str, int] = defaultdict(int)

        for r in inspections:
            cat = r.get("defect_category")
            defective = r.get("defective_units", 0)
            if cat and cat != "None" and defective > 0:
                category_counts[cat] += defective

        total_defects = sum(category_counts.values())
        if total_defects == 0:
            return ParetoAnalysisResponse(
                items=[],
                total_defects=0,
                vital_few_categories=[],
                cumulative_80_threshold=80.0,
                methodology_note="Zero defect records found in dataset."
            )

        # Sort descending by defect count
        sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)

        items: List[ParetoItem] = []
        cumulative_sum = 0
        vital_few: List[str] = []
        crossed_80 = False

        for cat, count in sorted_categories:
            percentage = round((count / total_defects) * 100.0, 2)
            cumulative_sum += count
            cumulative_pct = round((cumulative_sum / total_defects) * 100.0, 2)

            is_vital = not crossed_80
            if is_vital:
                vital_few.append(cat)
            if cumulative_pct >= 80.0:
                crossed_80 = True

            items.append(ParetoItem(
                category=cat,
                defect_count=count,
                percentage=percentage,
                cumulative_percentage=min(100.0, cumulative_pct),
                is_vital_few=is_vital
            ))

        return ParetoAnalysisResponse(
            items=items,
            total_defects=total_defects,
            vital_few_categories=vital_few,
            cumulative_80_threshold=80.0,
            methodology_note="Pareto analysis ranks failure modes by frequency. Categories up to 80% cumulative defect contribution represent highest-leverage targets for corrective engineering."
        )

    @staticmethod
    def calculate_defect_trends(
        inspections: List[Dict[str, Any]],
        grouping: str = "daily"
    ) -> DefectTrendResponse:
        """
        Groups inspections into daily, weekly, or monthly time-series buckets.
        """
        buckets: Dict[str, Dict[str, int]] = defaultdict(lambda: {"inspected": 0, "defective": 0, "defects": 0})

        for r in inspections:
            dt = r.get("inspection_date")
            if not dt:
                continue
            if isinstance(dt, str):
                try:
                    dt = datetime.datetime.fromisoformat(dt)
                except ValueError:
                    continue

            if grouping == "weekly":
                # Year-Wxx format
                period_key = f"{dt.year}-W{dt.isocalendar()[1]:02d}"
            elif grouping == "monthly":
                period_key = dt.strftime("%Y-%m")
            else: # daily
                period_key = dt.strftime("%Y-%m-%d")

            buckets[period_key]["inspected"] += r.get("units_inspected", 0)
            buckets[period_key]["defective"] += r.get("defective_units", 0)
            if r.get("defect_category") and r.get("defect_category") != "None":
                buckets[period_key]["defects"] += r.get("defective_units", 0)

        points: List[DefectTrendPoint] = []
        for period in sorted(buckets.keys()):
            data = buckets[period]
            inspected = data["inspected"]
            defective = data["defective"]
            rate = round((defective / inspected * 100.0), 2) if inspected > 0 else 0.0

            points.append(DefectTrendPoint(
                period=period,
                inspected_units=inspected,
                defective_units=defective,
                defect_rate=rate,
                defect_count=data["defects"]
            ))

        return DefectTrendResponse(grouping=grouping, points=points)

    @staticmethod
    def calculate_production_line_comparison(
        inspections: List[Dict[str, Any]],
        normal_threshold: float = 2.0,
        warning_threshold: float = 5.0
    ) -> List[LineComparisonItem]:
        """
        Compares defect rates across manufacturing production lines.
        """
        lines_data: Dict[str, Dict[str, int]] = defaultdict(lambda: {"inspected": 0, "defective": 0})

        for r in inspections:
            line = r.get("production_line", "Unknown Line")
            lines_data[line]["inspected"] += r.get("units_inspected", 0)
            lines_data[line]["defective"] += r.get("defective_units", 0)

        results: List[LineComparisonItem] = []
        for line in sorted(lines_data.keys()):
            inspected = lines_data[line]["inspected"]
            defective = lines_data[line]["defective"]
            rate = round((defective / inspected * 100.0), 2) if inspected > 0 else 0.0

            if rate > warning_threshold:
                status = "CRITICAL"
            elif rate > normal_threshold:
                status = "WARNING"
            else:
                status = "NORMAL"

            results.append(LineComparisonItem(
                production_line=line,
                inspected_units=inspected,
                defective_units=defective,
                defect_rate=rate,
                status=status
            ))

        return results

    @staticmethod
    def calculate_machine_performance(
        inspections: List[Dict[str, Any]],
        warning_threshold: float = 5.0
    ) -> List[MachinePerformanceItem]:
        """
        Computes defect rate and primary failure mode for each machine.
        """
        machines: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "inspected": 0,
            "defective": 0,
            "line": "",
            "categories": defaultdict(int)
        })

        for r in inspections:
            mch = r.get("machine_id", "MCH-01")
            machines[mch]["inspected"] += r.get("units_inspected", 0)
            machines[mch]["defective"] += r.get("defective_units", 0)
            if r.get("production_line"):
                machines[mch]["line"] = r.get("production_line")
            cat = r.get("defect_category")
            if cat and cat != "None":
                machines[mch]["categories"][cat] += r.get("defective_units", 0)

        results: List[MachinePerformanceItem] = []
        for mch in sorted(machines.keys()):
            inspected = machines[mch]["inspected"]
            defective = machines[mch]["defective"]
            rate = round((defective / inspected * 100.0), 2) if inspected > 0 else 0.0
            
            # Find top defect category
            top_cat = None
            if machines[mch]["categories"]:
                top_cat = max(machines[mch]["categories"].items(), key=lambda x: x[1])[0]

            alert = rate > warning_threshold
            status = "CRITICAL" if rate > warning_threshold else ("WARNING" if rate > 2.0 else "NORMAL")

            results.append(MachinePerformanceItem(
                machine_id=mch,
                machine_name=f"Assembly Station {mch}",
                production_line=machines[mch]["line"] or "Line Alpha",
                inspected_units=inspected,
                defective_units=defective,
                defect_rate=rate,
                top_defect_category=top_cat,
                status=status,
                alert=alert
            ))

        return results

    @staticmethod
    def detect_anomalies(
        inspections: List[Dict[str, Any]],
        critical_threshold: float = 5.0
    ) -> List[AnomalyItem]:
        """
        Detects anomalous statistical spikes in defect rates.
        """
        anomalies: List[AnomalyItem] = []

        # Find high-spike inspections
        for r in inspections:
            inspected = r.get("units_inspected", 0)
            defective = r.get("defective_units", 0)
            if inspected >= 100:
                rate = (defective / inspected) * 100.0
                if rate >= critical_threshold:
                    dt_str = str(r.get("inspection_date", ""))[:10]
                    anomalies.append(AnomalyItem(
                        date=dt_str,
                        entity_type="machine",
                        entity_id=r.get("machine_id", "Unknown"),
                        metric="Defect Rate",
                        observed_value=round(rate, 2),
                        expected_threshold=critical_threshold,
                        severity="High" if rate >= 10.0 else "Medium",
                        description=f"Defect rate spiked to {round(rate, 2)}% on machine {r.get('machine_id')} for line {r.get('production_line')} (Defect: {r.get('defect_category', 'General')})"
                    ))

        return anomalies[:20] # Top 20 most recent / critical anomalies
