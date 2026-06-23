"""Tests for ChronosOS Python microservice."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from main import app, CAFFEINE_HALF_LIFE_HOURS

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_caffeine_decay_zero_elapsed():
    now = datetime.now(timezone.utc).isoformat()
    response = client.post("/caffeine/decay", json={
        "amount_mg": 100,
        "consumed_at": now,
        "as_of": now,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["current_mg"] == pytest.approx(100, abs=0.1)
    assert data["half_lives_passed"] == pytest.approx(0, abs=0.01)


def test_caffeine_decay_one_half_life():
    now = datetime.now(timezone.utc)
    consumed = (now - timedelta(hours=CAFFEINE_HALF_LIFE_HOURS)).isoformat()
    response = client.post("/caffeine/decay", json={
        "amount_mg": 100,
        "consumed_at": consumed,
        "as_of": now.isoformat(),
    })
    assert response.status_code == 200
    data = response.json()
    assert data["current_mg"] == pytest.approx(50, abs=0.1)
    assert data["half_lives_passed"] == pytest.approx(1, abs=0.01)


def test_caffeine_decay_two_half_lives():
    now = datetime.now(timezone.utc)
    consumed = (now - timedelta(hours=CAFFEINE_HALF_LIFE_HOURS * 2)).isoformat()
    response = client.post("/caffeine/decay", json={
        "amount_mg": 100,
        "consumed_at": consumed,
        "as_of": now.isoformat(),
    })
    assert response.status_code == 200
    data = response.json()
    assert data["current_mg"] == pytest.approx(25, abs=0.1)
    assert data["half_lives_passed"] == pytest.approx(2, abs=0.01)


def test_macro_warning_high_carb():
    start = datetime.now(timezone.utc).isoformat()
    response = client.post("/nutrition/macro-warning", json={
        "protein_g": 20,
        "fat_g": 10,
        "carbs_g": 100,
        "total_calories": 600,
        "planned_focus_blocks": [{"start": start, "duration_min": 30}],
    })
    assert response.status_code == 200
    data = response.json()
    assert data["high_carb_crash_risk"] is True
    assert len(data["adjusted_blocks"]) == 1
    shifted = datetime.fromisoformat(data["adjusted_blocks"][0]["start"])
    original = datetime.fromisoformat(start)
    assert (original - shifted).total_seconds() == pytest.approx(3600, abs=1)


def test_macro_warning_balanced():
    start = datetime.now(timezone.utc).isoformat()
    response = client.post("/nutrition/macro-warning", json={
        "protein_g": 40,
        "fat_g": 30,
        "carbs_g": 30,
        "total_calories": 600,
        "planned_focus_blocks": [{"start": start, "duration_min": 30}],
    })
    assert response.status_code == 200
    data = response.json()
    assert data["high_carb_crash_risk"] is False
    assert data["adjusted_blocks"][0]["start"] == start
