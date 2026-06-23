"""ChronosOS Python microservice.

Provides caffeine decay modeling and nutrition macro-crash risk analysis
for the ChronosOS scheduling platform.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

# Biological half-life of caffeine in hours.
CAFFEINE_HALF_LIFE_HOURS: float = 5.0

# Caloric density of carbohydrates (kcal per gram).
CARB_CALORIES_PER_GRAM: float = 4.0

# Threshold above which a meal is considered a high carbohydrate load.
HIGH_CARB_RATIO_THRESHOLD: float = 0.55

# Minutes to shift focus blocks earlier when a crash risk is detected.
CRASH_SHIFT_MINUTES: int = 60


app = FastAPI(title="ChronosOS Python Service", version="1.0.0")


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class CaffeineDecayRequest(BaseModel):
    amount_mg: float = Field(..., description="Caffeine consumed, in milligrams.")
    consumed_at: str = Field(
        ..., description="ISO8601 timestamp of when the caffeine was consumed."
    )
    as_of: Optional[str] = Field(
        default=None,
        description="ISO8601 timestamp to compute remaining caffeine against. "
        "Defaults to the current time.",
    )


class CaffeineDecayResponse(BaseModel):
    current_mg: float = Field(..., description="Estimated caffeine remaining, in mg.")
    half_lives_passed: float = Field(
        ..., description="Number of half-lives elapsed since consumption."
    )


class FocusBlock(BaseModel):
    start: str = Field(..., description="ISO8601 start timestamp of the focus block.")
    duration_min: int = Field(..., description="Planned duration of the block, in minutes.")


class MacroWarningRequest(BaseModel):
    protein_g: float = Field(..., description="Protein content of the meal, in grams.")
    fat_g: float = Field(..., description="Fat content of the meal, in grams.")
    carbs_g: float = Field(..., description="Carbohydrate content of the meal, in grams.")
    total_calories: float = Field(..., description="Total calories of the meal.")
    planned_focus_blocks: List[FocusBlock] = Field(
        default_factory=list,
        description="Focus blocks scheduled after the meal.",
    )


class MacroWarningResponse(BaseModel):
    high_carb_crash_risk: bool = Field(
        ..., description="Whether the meal poses a high carbohydrate crash risk."
    )
    recommendation: str = Field(..., description="Actionable guidance for the user.")
    adjusted_blocks: List[FocusBlock] = Field(
        ..., description="Focus blocks, shifted if a crash risk was detected."
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_dt(value: str) -> datetime:
    """Parse an ISO8601 string into a timezone-aware datetime.

    Naive datetimes are assumed to be UTC so that two timestamps can always be
    subtracted safely.
    """
    # Python 3.11's fromisoformat accepts a trailing "Z" and offsets.
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _shift_block_earlier(block: FocusBlock, minutes: int) -> FocusBlock:
    """Return a copy of a focus block with its start moved earlier."""
    start_dt = _parse_dt(block.start)
    shifted = start_dt - timedelta(minutes=minutes)
    return FocusBlock(start=shifted.isoformat(), duration_min=block.duration_min)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/caffeine/decay", response_model=CaffeineDecayResponse)
async def caffeine_decay(request: CaffeineDecayRequest) -> CaffeineDecayResponse:
    consumed_at = _parse_dt(request.consumed_at)
    as_of = _parse_dt(request.as_of) if request.as_of else datetime.now(timezone.utc)

    elapsed_hours = (as_of - consumed_at).total_seconds() / 3600.0
    half_lives_passed = elapsed_hours / CAFFEINE_HALF_LIFE_HOURS
    current_mg = request.amount_mg * math.pow(0.5, half_lives_passed)

    return CaffeineDecayResponse(
        current_mg=current_mg,
        half_lives_passed=half_lives_passed,
    )


@app.post("/nutrition/macro-warning", response_model=MacroWarningResponse)
async def macro_warning(request: MacroWarningRequest) -> MacroWarningResponse:
    if request.total_calories <= 0:
        return MacroWarningResponse(
            high_carb_crash_risk=False,
            recommendation=(
                "Total calories must be greater than zero to assess crash risk. "
                "Please log the full meal so we can check the carbohydrate ratio."
            ),
            adjusted_blocks=request.planned_focus_blocks,
        )

    carb_calories = request.carbs_g * CARB_CALORIES_PER_GRAM
    carb_ratio = carb_calories / request.total_calories
    high_carb_crash_risk = carb_ratio > HIGH_CARB_RATIO_THRESHOLD

    if high_carb_crash_risk:
        ratio_pct = round(carb_ratio * 100)
        adjusted_blocks = [
            _shift_block_earlier(block, CRASH_SHIFT_MINUTES)
            for block in request.planned_focus_blocks
        ]
        recommendation = (
            f"Carbohydrates make up {ratio_pct}% of this meal's calories, which "
            f"can trigger an energy dip. Focus blocks have been moved "
            f"{CRASH_SHIFT_MINUTES} minutes earlier to work with your energy "
            "before the crash."
        )
    else:
        adjusted_blocks = request.planned_focus_blocks
        recommendation = (
            "Carbohydrate ratio is within a balanced range for sustained focus. "
            "No schedule adjustment needed."
        )

    return MacroWarningResponse(
        high_carb_crash_risk=high_carb_crash_risk,
        recommendation=recommendation,
        adjusted_blocks=adjusted_blocks,
    )
