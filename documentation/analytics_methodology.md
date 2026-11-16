# QualityLens – Engineering Analytics & Causal Methodology

## 1. Core Performance Metrics & Mathematical Definitions

### A. Defect Rate (%)
The primary indicator of process non-conformance:
$$\text{Defect Rate} = \left( \frac{\sum \text{Defective Units}}{\sum \text{Units Inspected}} \right) \times 100$$

**Edge Case Handling:**
When total units inspected equals 0, the engine safely returns `0.00%` rather than dividing by zero or raising an unhandled exception.

### B. First Pass Yield (FPY) (%)
First Pass Yield measures the proportion of manufactured units that meet quality specifications on initial inspection without requiring rework or scrap:
$$\text{FPY} = \left( \frac{\sum \text{Units Passing First Inspection}}{\sum \text{Units Inspected}} \right) \times 100$$

**Assumption Documentation:**
If the uploaded dataset records units inspected and defective units without an explicit passed-first column, units passing first inspection is defined as:
$$\text{Units Passing First Inspection} = \max(0, \text{Units Inspected} - \text{Defective Units})$$

---

## 2. Pareto Failure Mode Intelligence (80/20 Rule)

Pareto analysis operates on the empirical principle formulated by Vilfredo Pareto and applied to industrial engineering by Dr. Joseph Juran: a vital minority of failure mechanisms causes the overwhelming majority of total losses.

### Calculation Sequence:
1. **Defect Frequency Aggregation**: Sum defective units per failure mode:
   $$D_c = \sum_{r \in \text{Records}_c} \text{Defective Units}_r$$
2. **Descending Order Ranking**: Sort categories such that $D_1 \ge D_2 \ge \dots \ge D_k$.
3. **Percentage Contribution**:
   $$P_c = \left( \frac{D_c}{\sum_{j=1}^k D_j} \right) \times 100$$
4. **Cumulative Percentage**:
   $$C_m = \sum_{i=1}^m P_i$$
5. **Vital Few Classification**:
   Categories where $C_{m-1} < 80.0\%$ are classified as **Vital Few (High Priority Kaizen Target)**.

*QualityLens does not artificially force an 80/20 distribution; it computes and reveals the true mathematical curve.*

---

## 3. Threshold-Based Quality Monitoring

| Operating Zone | Range | Engineering Action Protocol |
| :--- | :--- | :--- |
| **Normal** | $\text{Rate} \le 2.0\%$ | Standard automated monitoring; shift checks routine. |
| **Warning** | $2.0\% < \text{Rate} \le 5.0\%$ | Preventive inspection triggered; tool calibration recommended. |
| **Critical** | $\text{Rate} > 5.0\%$ | Assembly station flagged; containment review mandated. |

---

## 4. Distinguishing Statistical Correlation from Verified Root Cause

An observed spike in defect rate or statistical correlation between a machine station and a defect category is an **indicator**, not a verified root cause.

In QualityLens:
1. **Statistical Detection**: Identifies that Machine MCH-04 has an elevated defect rate (6.8%) in Assembly Misalignment during Shift 3.
2. **Hypothesis Formulation**: Engineer formulates candidate hypotheses (thermal expansion, pneumatic pressure variance, fixture wear).
3. **5 Whys Causal Interrogation**: Step-by-step interrogation drilling through operational symptoms to systemic process weaknesses.
4. **Physical Verification**: Confirmed via measurement (dial indicator, metallurgical cross-section, high-speed camera).
5. **CAPA Execution**: Permanent corrective and preventive actions instituted to eliminate recurrence.
