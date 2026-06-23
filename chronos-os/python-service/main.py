from fastapi import FastAPI
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from typing import List
import math

app = FastAPI(title="ChronosOS Biometric Engine", version="1.0.0")

CAFFEINE_HALF_LIFE_SECONDS = 5 * 60 * 60  # 5 hours


class CaffeineEvent(BaseModel):
    amount_mg: float = Field(gt=0)
    timestamp_iso: str


class CaffeineDecayRequest(BaseModel):
    intake_events: List[CaffeineEvent]
    query_time_iso: str


class CaffeineDecayResponse(BaseModel):
    current_level_mg: float
    events: List[dict]


class Meal(BaseModel):
    protein_g: float = Field(ge=0)
    fat_g: float = Field(ge=0)
    carbs_g: float = Field(ge=0)
    fiber_g: float = Field(ge=0)
    timestamp_iso: str


class PlannedFocusBlock(BaseModel):
    start_iso: str
    duration_minutes: int = Field(gt=0)


class MacroAnalysisRequest(BaseModel):
    meals: List[Meal]
    planned_focus_blocks: List[PlannedFocusBlock]


class MacroAnalysisResponse(BaseModel):
    totals: dict
    crash_risk: bool
    recommended_focus_blocks: List[dict]
    reasoning: str


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/caffeine/decay", response_model=CaffeineDecayResponse)
def caffeine_decay(req: CaffeineDecayRequest):
    query_time = datetime.fromisoformat(req.query_time_iso.replace("Z", "+00:00"))
    total = 0.0
    enriched_events = []

    for ev in req.intake_events:
        intake_time = datetime.fromisoformat(ev.timestamp_iso.replace("Z", "+00:00"))
        delta_seconds = (query_time - intake_time).total_seconds()
        if delta_seconds < 0:
            remaining = 0.0
        else:
            remaining = ev.amount_mg * math.pow(0.5, delta_seconds / CAFFEINE_HALF_LIFE_SECONDS)
        total += remaining
        enriched_events.append({
            "amount_mg": ev.amount_mg,
            "timestamp_iso": ev.timestamp_iso,
            "remaining_mg": round(remaining, 2),
        })

    return CaffeineDecayResponse(
        current_level_mg=round(total, 2),
        events=enriched_events,
    )


@app.post("/nutrition/macro-analysis", response_model=MacroAnalysisResponse)
def macro_analysis(req: MacroAnalysisRequest):
    totals = {"protein_g": 0.0, "fat_g": 0.0, "carbs_g": 0.0, "fiber_g": 0.0}
    for meal in req.meals:
        totals["protein_g"] += meal.protein_g
        totals["fat_g"] += meal.fat_g
        totals["carbs_g"] += meal.carbs_g
        totals["fiber_g"] += meal.fiber_g

    totals = {k: round(v, 2) for k, v in totals.items()}

    crash_risk = False
    risk_reasons = []

    for block in req.planned_focus_blocks:
        block_start = datetime.fromisoformat(block.start_iso.replace("Z", "+00:00"))
        window_start = block_start - timedelta(hours=3)
        window_carbs = 0.0
        window_fiber = 0.0

        for meal in req.meals:
            meal_time = datetime.fromisoformat(meal.timestamp_iso.replace("Z", "+00:00"))
            if window_start <= meal_time <= block_start:
                window_carbs += meal.carbs_g
                window_fiber += meal.fiber_g

        if window_carbs > 80 and (window_fiber / window_carbs < 0.15 if window_carbs > 0 else False):
            crash_risk = True
            risk_reasons.append(
                f"High carbs ({window_carbs:.1f}g) with low fiber ratio "
                f"({(window_fiber/window_carbs)*100:.1f}%) within 3h of focus block at {block.start_iso}"
            )

    recommended_blocks = []
    for block in req.planned_focus_blocks:
        block_dict = {
            "start_iso": block.start_iso,
            "duration_minutes": block.duration_minutes,
        }
        if crash_risk:
            new_start = datetime.fromisoformat(block.start_iso.replace("Z", "+00:00")) + timedelta(minutes=90)
            block_dict["start_iso"] = new_start.isoformat().replace("+00:00", "Z")
            block_dict["delayed_by_minutes"] = 90
        recommended_blocks.append(block_dict)

    reasoning = (
        "High carbohydrate load with insufficient fiber detected within pre-focus window. "
        "Recommended delaying focus blocks by 90 minutes to avoid projected glucose crash."
        if crash_risk else
        "Macro balance within safe parameters for sustained cognitive performance."
    )

    return MacroAnalysisResponse(
        totals=totals,
        crash_risk=crash_risk,
        recommended_focus_blocks=recommended_blocks,
        reasoning=reasoning,
    )
