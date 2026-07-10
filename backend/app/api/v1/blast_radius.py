"""
Cartographer — Blast Radius Router.

Triggers blast radius estimation for proposed changes.
Full agent implementation in Phase 5.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import CurrentUser

router = APIRouter(prefix="/blast-radius")


class BlastRadiusRequest(BaseModel):
    repository_id: uuid.UUID
    symbol_name: str
    file_path: str
    proposed_change: str


class BlastRadiusResponse(BaseModel):
    affected_files: list[str]
    affected_nodes: list[dict]
    risk_level: str
    risk_score: float
    reasoning: str
    dependency_chain: list[str]


@router.post("/estimate", response_model=BlastRadiusResponse)
async def estimate_blast_radius(
    body: BlastRadiusRequest,
    current_user: CurrentUser,
) -> BlastRadiusResponse:
    """
    Estimate the blast radius of a proposed code change.

    Full implementation in Phase 5 — routes through the Blast Radius Agent.
    """
    # Phase 5: invoke agent pipeline
    return BlastRadiusResponse(
        affected_files=[],
        affected_nodes=[],
        risk_level="unknown",
        risk_score=0.0,
        reasoning="Blast Radius Agent not yet implemented (Phase 5).",
        dependency_chain=[],
    )
