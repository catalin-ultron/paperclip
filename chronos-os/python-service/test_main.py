import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from main import app, CAFFEINE_HALF_LIFE_SECONDS

client = TestClient(app)


class TestHealth:
    def test_health(self):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"


class TestCaffeineDecay:
    def test_single_event(self):
        now = datetime.utcnow()
        payload = {
            "intake_events": [{"amount_mg": 100, "timestamp_iso": now.isoformat() + "Z"}],
            "query_time_iso": now.isoformat() + "Z",
        }
        res = client.post("/caffeine/decay", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["current_level_mg"] == 100.0
        assert data["events"][0]["remaining_mg"] == 100.0

    def test_half_life_boundary(self):
        now = datetime.utcnow()
        past = now - timedelta(seconds=CAFFEINE_HALF_LIFE_SECONDS)
        payload = {
            "intake_events": [{"amount_mg": 100, "timestamp_iso": past.isoformat() + "Z"}],
            "query_time_iso": now.isoformat() + "Z",
        }
        res = client.post("/caffeine/decay", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert abs(data["current_level_mg"] - 50.0) < 0.1

    def test_multiple_events(self):
        now = datetime.utcnow()
        e1 = now - timedelta(hours=5)
        e2 = now - timedelta(hours=2)
        payload = {
            "intake_events": [
                {"amount_mg": 100, "timestamp_iso": e1.isoformat() + "Z"},
                {"amount_mg": 80, "timestamp_iso": e2.isoformat() + "Z"},
            ],
            "query_time_iso": now.isoformat() + "Z",
        }
        res = client.post("/caffeine/decay", json=payload)
        assert res.status_code == 200
        data = res.json()
        # 100 -> 50 after 5h, 80 -> ~56.57 after 2h (0.5^(2/5))
        expected = 50.0 + 80.0 * (0.5 ** (2 / 5))
        assert abs(data["current_level_mg"] - expected) < 0.5
        assert len(data["events"]) == 2

    def test_future_event_zero(self):
        now = datetime.utcnow()
        future = now + timedelta(hours=1)
        payload = {
            "intake_events": [{"amount_mg": 100, "timestamp_iso": future.isoformat() + "Z"}],
            "query_time_iso": now.isoformat() + "Z",
        }
        res = client.post("/caffeine/decay", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["current_level_mg"] == 0.0


class TestMacroAnalysis:
    def test_high_crash_risk(self):
        now = datetime.utcnow()
        meal_time = now.isoformat() + "Z"
        block_time = (now + timedelta(hours=1)).isoformat() + "Z"
        payload = {
            "meals": [
                {"protein_g": 20, "fat_g": 15, "carbs_g": 120, "fiber_g": 5, "timestamp_iso": meal_time}
            ],
            "planned_focus_blocks": [{"start_iso": block_time, "duration_minutes": 90}],
        }
        res = client.post("/nutrition/macro-analysis", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["crash_risk"] is True
        assert data["totals"]["carbs_g"] == 120.0
        assert data["recommended_focus_blocks"][0]["delayed_by_minutes"] == 90
        assert "glucose crash" in data["reasoning"].lower()

    def test_safe_macros(self):
        now = datetime.utcnow()
        meal_time = now.isoformat() + "Z"
        block_time = (now + timedelta(hours=1)).isoformat() + "Z"
        payload = {
            "meals": [
                {"protein_g": 40, "fat_g": 30, "carbs_g": 40, "fiber_g": 15, "timestamp_iso": meal_time}
            ],
            "planned_focus_blocks": [{"start_iso": block_time, "duration_minutes": 60}],
        }
        res = client.post("/nutrition/macro-analysis", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["crash_risk"] is False
        assert "safe" in data["reasoning"].lower()
        assert "delayed_by_minutes" not in data["recommended_focus_blocks"][0]

    def test_fiber_ratio_threshold(self):
        now = datetime.utcnow()
        meal_time = now.isoformat() + "Z"
        block_time = (now + timedelta(hours=1)).isoformat() + "Z"
        payload = {
            "meals": [
                {"protein_g": 20, "fat_g": 15, "carbs_g": 100, "fiber_g": 16, "timestamp_iso": meal_time}
            ],
            "planned_focus_blocks": [{"start_iso": block_time, "duration_minutes": 60}],
        }
        res = client.post("/nutrition/macro-analysis", json=payload)
        assert res.status_code == 200
        data = res.json()
        # fiber/carbs = 0.16 which is >= 0.15, so no crash risk
        assert data["crash_risk"] is False
