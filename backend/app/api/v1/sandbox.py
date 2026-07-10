"""
Cartographer — Sandbox Router.

Manages Docker sandbox job lifecycle.
Full implementation in Phase 6.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, RepositoryRepo

router = APIRouter(prefix="/sandbox")


class CreateSandboxJobRequest(BaseModel):
    repository_id: uuid.UUID
    code_edits: list[dict]
    test_command: str = "pytest"
    agent_run_id: uuid.UUID | None = None


class SandboxJobResponse(BaseModel):
    id: str
    repository_id: str
    status: str
    diff: str | None
    test_passed: bool | None
    test_summary: dict
    execution_logs: str | None
    duration_seconds: float | None
    created_at: str


@router.post("/jobs", response_model=SandboxJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_sandbox_job(
    body: CreateSandboxJobRequest,
    current_user: CurrentUser,
    repo: RepositoryRepo,
) -> SandboxJobResponse:
    """
    Queue a new sandbox execution job.

    Full implementation in Phase 6 — Docker executor, git worktrees,
    test execution, diff generation, and rollback.
    """
    repository = await repo.get_by_id(body.repository_id)
    if not repository or repository.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Repository not found.")

    # Phase 6: invoke SandboxManager.create_job(...)
    return SandboxJobResponse(
        id=str(uuid.uuid4()),
        repository_id=str(body.repository_id),
        status="queued",
        diff=None,
        test_passed=None,
        test_summary={},
        execution_logs=None,
        duration_seconds=None,
        created_at=datetime.now(UTC).isoformat(),
    )


@router.get("/jobs/{job_id}", response_model=SandboxJobResponse)
async def get_sandbox_job(
    job_id: uuid.UUID,
    current_user: CurrentUser,
) -> SandboxJobResponse:
    """Get sandbox job status and results."""
    # Phase 6: fetch from DB
    raise HTTPException(status_code=404, detail="Job not found.")
