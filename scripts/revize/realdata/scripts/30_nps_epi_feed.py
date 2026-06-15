#!/usr/bin/env python3
# 30_nps_epi_feed.py — REAL epidemiological layer for Module 8 (Global NPS Radar).
# Deterministic parse (no model, no randomness). All numbers come from:
#   (a) EUDA European Drug Report 2025 source-data CSVs — downloaded & SHA-256 recorded (reproducible):
#       EDR25-NPS-1 (first reported per year, by group), EDR25-NPS-3a (number of seizures per year),
#       EDR25-NPS-6 (2024 formal notifications).
#   (b) UNODC Early Warning Advisory (EWA) — verbatim published counts (dated, sourced); no open CSV/API here.
import csv, json, hashlib, os, platform

DL = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "out", "dl"))


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(8192), b""):
            h.update(b)
    return h.hexdigest()


def num(x):
    x = (x or "").strip()
    return 0 if x in ("", " ") else int(x)


# --- EDR25-NPS-1: first reported per year, by substance group ---
nps1 = os.path.join(DL, "euda_edr25_nps1_first_reported.csv")
per_year, year_totals = {}, {}
with open(nps1, encoding="utf-8-sig", newline="") as f:
    r = csv.reader(f)
    groups = next(r)[1:]
    for row in r:
        if not row or not row[0].strip():
            continue
        year = int(row[0])
        vals = [num(v) for v in row[1:1 + len(groups)]]
        per_year[year] = dict(zip(groups, vals))
        year_totals[year] = sum(vals)
total_first = sum(year_totals.values())
peak_year = max(year_totals, key=year_totals.get)
g2024 = {k: v for k, v in per_year[2024].items() if v}

# --- EDR25-NPS-3a: number of seizures per year ---
nps3 = os.path.join(DL, "euda_edr25_nps3a_seizures_number.csv")
seiz = {}
with open(nps3, encoding="utf-8-sig", newline="") as f:
    rr = list(csv.reader(f))
    yrs = rr[0][1:]
    for row in rr[1:]:
        if row and row[0].strip().lower().startswith("number"):
            for y, v in zip(yrs, row[1:]):
                seiz[int(y)] = int(v)
seiz_peak_year = max(seiz, key=seiz.get)
seiz_total = sum(seiz.values())

# --- EDR25-NPS-6: 2024 formal notifications ---
nps6 = os.path.join(DL, "euda_edr25_nps6_notifications.csv")
with open(nps6, encoding="utf-8-sig", newline="") as f:
    notif_2024 = len(list(csv.DictReader(f)))

# --- UNODC EWA verified published figures (verbatim, sourced/dated) ---
unodc = {
    "source": "UNODC Early Warning Advisory on NPS (EWA), Database",
    "accessed": "2025-10-10",
    "cumulative_unique_nps_2009_2024": 1396,
    "reporting_countries_territories": 153,
    "annual_2024_unique_nps": 688,
    "annual_2024_is_record": True,
    "newly_emerged_2024": 101,
    "newly_emerged_2024_countries": 45,
    "effect_group_share_2024_pct": {
        "stimulants": 33, "synthetic_cannabinoid_receptor_agonists": 24,
        "classic_hallucinogens": 14, "synthetic_opioids": 9, "unassigned": 9,
        "sedatives_hypnotics": 7, "dissociatives": 4,
    },
    "historical_cumulative_dec2021": {"nps": 1124, "countries": 134},
    "refs": [
        "https://www.unodc.org/LSS/Announcement/Details/d748996b-12a9-4236-8be9-8b0d40eab2d6",
        "https://www.unodc.org/LSS/Announcement/Details/40df1bf0-4f70-4862-844e-20536e0d95fd",
    ],
}

# --- fail-fast invariants: guard against silent EUDA source/schema drift (zero-hallucination) ---
assert year_totals.get(2024) == 47, ("EUDA 2024 first-reported drift", year_totals.get(2024))
assert year_totals.get(2023) == 26, ("EUDA 2023 first-reported drift", year_totals.get(2023))
assert per_year[2024].get("Cannabinoids") == 20, "EUDA 2024 cannabinoids drift"
assert per_year[2024].get("Opioids") == 7, "EUDA 2024 opioids drift"
assert notif_2024 == 47, ("EUDA 2024 notification rows drift", notif_2024)
assert seiz_peak_year == 2016 and seiz.get(2016) == 46019, "EUDA seizures peak drift"
assert min(seiz) == 2005 and max(seiz) == 2023 and len(seiz) == 19, "EUDA seizures year-range drift"

out = {
    "module": "8_nps_epi_feed",
    "python_version": platform.python_version(),
    "note": ("REAL epidemiological layer for the NPS chemical-space radar. EUDA CSVs are downloaded and "
             "reproducible (SHA-256 below); UNODC EWA figures are verbatim published counts (no open CSV/API "
             "in this environment). No real-time programmatic per-country feed exists, but authoritative annual "
             "counts are public."),
    "euda_edr2025": {
        "source": "EUDA European Drug Report 2025 source data",
        "url": "https://www.euda.europa.eu/data/source-data/edr/2025/complete_en",
        "first_reported_per_year_by_group": per_year,
        "first_reported_total_per_year": year_totals,
        "total_first_reported_2005_2024": total_first,
        "peak_year": [peak_year, year_totals[peak_year]],
        "first_reported_2024": year_totals.get(2024),
        "first_reported_2023": year_totals.get(2023),
        "groups_2024": g2024,
        "seizures_number_per_year": seiz,
        "seizures_peak": [seiz_peak_year, seiz[seiz_peak_year]],
        "seizures_total_2005_2023": seiz_total,
        "seizures_2023": seiz.get(2023),
        "formal_notifications_2024_count": notif_2024,
        "monitored_end_2024": 1000,
    },
    "unodc_ewa": unodc,
    "input_sha256": {
        os.path.basename(nps1): sha(nps1),
        os.path.basename(nps3): sha(nps3),
        os.path.basename(nps6): sha(nps6),
    },
}
outpath = os.path.join(DL, "nps_epi_feed.json")
with open(outpath, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print("WROTE", outpath)
print("EUDA first-reported 2024:", year_totals.get(2024), "(EUDA text states 47)")
print("EUDA first-reported 2023:", year_totals.get(2023))
print("EUDA total 2005-2024:", total_first)
print("EUDA peak year:", peak_year, "=", year_totals[peak_year])
print("EUDA groups 2024:", g2024)
print("EUDA seizures peak:", seiz_peak_year, "=", seiz[seiz_peak_year], "| 2023:", seiz.get(2023), "| total:", seiz_total)
print("EUDA formal notifications 2024:", notif_2024)
print("UNODC cumulative:", unodc["cumulative_unique_nps_2009_2024"], "by", unodc["reporting_countries_territories"], "| 2024 record:", unodc["annual_2024_unique_nps"])
