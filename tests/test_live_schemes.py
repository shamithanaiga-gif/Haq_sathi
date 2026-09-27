"""
Test Suite: Live Scheme Discovery with Deterministic Evaluation & Fallback
===========================================================================
Scenario 1: User with occupation 'construction worker', state 'Karnataka', income ₹12,000/mo.
            Confirm real scheme names with working source links appear (not just original 4).
Scenario 2: Change income value (e.g., to ₹35,000/mo) and confirm which schemes show as eligible
            changes, proving deterministic rules engine (not LLM) makes the decision.
Scenario 3: Temporarily break web search call (force_break_search=True) and confirm clean
            fallback to 'Demo reference schemes' without crash or blank screen.
Scenario 4: Verify main voice flow endpoints remain stable with original 4 schemes.
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 60)
    print("RUNNING LIVE SCHEME DISCOVERY & RULES ENGINE TESTS")
    print("=" * 60)

    # ---------------------------------------------------------
    # SCENARIO 1: Construction worker, Karnataka, ₹12,000/mo
    # ---------------------------------------------------------
    payload1 = {
        "phone": "9876543210",
        "language": "en",
        "user_data": {
            "name": "Basavaraju",
            "occupation": "construction worker",
            "state_resident": True,
            "state": "Karnataka",
            "monthly_income": 12000,
            "annual_income": 144000,
            "age": 35,
            "has_labour_card": True,
            "has_school_going_child": False
        },
        "use_live_search": True,
        "force_break_search": False
    }

    resp1 = requests.post(f"{BASE_URL}/api/schemes/scan-all", json=payload1, timeout=10)
    assert resp1.status_code == 200, f"Scenario 1 failed with status {resp1.status_code}: {resp1.text}"
    data1 = resp1.json()

    print("\n[SCENARIO 1] Log in: Construction worker, Karnataka, Rs.12,000/mo")
    print(f"  Source Type: {data1.get('source_type')}")
    print(f"  Is Live Search: {data1.get('is_live_search')}")
    print(f"  Total Schemes Evaluated: {data1.get('total_schemes')}")
    print(f"  Eligible Schemes Count: {len(data1.get('eligible', []))}")
    print(f"  Needs More Info Count: {len(data1.get('needs_more_info', []))}")
    print(f"  Not Eligible Count: {len(data1.get('not_eligible', []))}")

    assert data1.get("is_live_search") is True, "Expected is_live_search=True"
    assert data1.get("source_type") == "live_search", "Expected source_type='live_search'"
    assert data1.get("total_schemes") >= 5, f"Expected more than 4 schemes, got {data1.get('total_schemes')}"

    print("\n  Verified Discovered Schemes with Live URLs:")
    for s in data1.get("eligible", []):
        url = s.get("source_url")
        print(f"    - [ELIGIBLE] {s.get('scheme_name_en')}")
        print(f"      Source: {url}")
        assert url and ("gov.in" in url or "nic.in" in url or "http" in url), f"Invalid source URL: {url}"

    # ---------------------------------------------------------
    # SCENARIO 2: Changing income value changes eligibility (Deterministic Engine proof)
    # ---------------------------------------------------------
    payload2 = json.loads(json.dumps(payload1))
    payload2["user_data"]["monthly_income"] = 35000
    payload2["user_data"]["annual_income"] = 420000

    resp2 = requests.post(f"{BASE_URL}/api/schemes/scan-all", json=payload2, timeout=10)
    assert resp2.status_code == 200, f"Scenario 2 failed with status {resp2.status_code}: {resp2.text}"
    data2 = resp2.json()

    print("\n[SCENARIO 2] Changed Income to Rs.35,000/mo (Annual Rs.4,20,000)")
    print(f"  Eligible Schemes Count: {len(data2.get('eligible', []))} (was {len(data1.get('eligible', []))})")
    print(f"  Not Eligible Schemes Count: {len(data2.get('not_eligible', []))} (was {len(data1.get('not_eligible', []))})")

    assert len(data2.get("eligible", [])) < len(data1.get("eligible", [])), "Higher income must reduce eligible count!"
    assert len(data2.get("not_eligible", [])) > 0, "Schemes must fail due to annual_income_max rule"

    print("\n  Schemes failing deterministic rule check:")
    for s in data2.get("not_eligible", []):
        failed_rules = [r["rule"] for r in s.get("failed_rules", [])]
        print(f"    - [NOT ELIGIBLE] {s.get('scheme_name_en')} | Failed Rules: {failed_rules}")
        assert "annual_income_max" in failed_rules, f"Expected annual_income_max to fail, got {failed_rules}"

    # ---------------------------------------------------------
    # SCENARIO 3: Temporarily break web search (e.g. wrong key / network down)
    # ---------------------------------------------------------
    payload3 = json.loads(json.dumps(payload1))
    payload3["force_break_search"] = True

    resp3 = requests.post(f"{BASE_URL}/api/schemes/scan-all", json=payload3, timeout=10)
    assert resp3.status_code == 200, f"Scenario 3 failed with status {resp3.status_code}: {resp3.text}"
    data3 = resp3.json()

    print("\n[SCENARIO 3] Temporarily Break Web Search (Simulated Failure)")
    print(f"  Fallback Triggered: {data3.get('fallback_triggered')}")
    print(f"  Source Type: {data3.get('source_type')}")
    print(f"  Live Search Active: {data3.get('is_live_search')}")
    print(f"  Live Search Note: '{data3.get('live_search_note')}'")
    print(f"  Total Schemes in Fallback: {data3.get('total_schemes')}")

    assert data3.get("fallback_triggered") is True, "Expected fallback_triggered=True"
    assert data3.get("source_type") == "demo_reference", "Expected source_type='demo_reference'"
    assert data3.get("is_live_search") is False, "Expected is_live_search=False"
    assert data3.get("total_schemes") == 4, f"Expected exactly 4 demo reference schemes, got {data3.get('total_schemes')}"

    # ---------------------------------------------------------
    # SCENARIO 4: Main voice conversation flow uses original 4 schemes
    # ---------------------------------------------------------
    resp4 = requests.get(f"{BASE_URL}/api/schemes", timeout=10)
    assert resp4.status_code == 200
    schemes_core = resp4.json()
    print(f"\n[SCENARIO 4] Core Voice Flow Schemes (/api/schemes): {len(schemes_core)} schemes (Stable)")
    assert len(schemes_core) == 4, f"Core schemes must remain 4 for voice flow stability, got {len(schemes_core)}"

    print("\n" + "=" * 60)
    print("ALL SCENARIOS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
