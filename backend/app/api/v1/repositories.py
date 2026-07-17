"""
Cartographer — Repositories Router.

CRUD endpoints for code repositories + ingestion trigger.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel

from app.db.models.repository import RepositoryStatus
from app.services.ingestion.ingestion_worker import run_ingestion

from app.api.deps import CurrentUser, RepositoryRepo

if TYPE_CHECKING:
    import uuid

router = APIRouter(prefix="/repositories")


class CreateRepositoryRequest(BaseModel):
    url: str
    name: str
    description: str | None = None
    default_branch: str = "main"


class RepositoryResponse(BaseModel):
    id: str
    name: str
    url: str
    description: str | None
    status: str
    total_files: int
    total_chunks: int
    total_nodes: int
    total_edges: int
    languages: dict
    created_at: str
    ingested_at: str | None


@router.get("/", response_model=list[RepositoryResponse])
async def list_repositories(
    current_user: CurrentUser,
    repo: RepositoryRepo,
    limit: int = 50,
    offset: int = 0,
) -> list[RepositoryResponse]:
    """List all repositories owned by the current user."""
    repositories = await repo.get_by_owner(current_user.id, limit=limit, offset=offset)
    return [_to_response(r) for r in repositories]


@router.post("/", response_model=RepositoryResponse, status_code=status.HTTP_201_CREATED)
async def create_repository(
    body: CreateRepositoryRequest,
    current_user: CurrentUser,
    repo: RepositoryRepo,
    background_tasks: BackgroundTasks,
) -> RepositoryResponse:
    """Add a repository and trigger ingestion as a background task."""
    existing = await repo.get_by_url(body.url, current_user.id)
    if existing:
        raise HTTPException(status_code=409, detail="Repository already added.")

    repository = await repo.create(
        owner_id=current_user.id,
        url=body.url,
        name=body.name,
        description=body.description,
        default_branch=body.default_branch,
        status=RepositoryStatus.PENDING,
    )

    # Trigger ingestion as a background task
    background_tasks.add_task(run_ingestion, repository.id)

    return _to_response(repository)


@router.get("/{repo_id}", response_model=RepositoryResponse)
async def get_repository(
    repo_id: uuid.UUID,
    current_user: CurrentUser,
    repo: RepositoryRepo,
) -> RepositoryResponse:
    """Get a single repository by ID."""
    repository = await repo.get_by_id(repo_id)
    if not repository or repository.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Repository not found.")
    return _to_response(repository)


@router.delete("/{repo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_repository(
    repo_id: uuid.UUID,
    current_user: CurrentUser,
    repo: RepositoryRepo,
) -> None:
    """Delete a repository and all its data."""
    repository = await repo.get_by_id(repo_id)
    if not repository or repository.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Repository not found.")
    await repo.delete(repo_id)


@router.post("/{repo_id}/ingest", status_code=status.HTTP_202_ACCEPTED)
async def trigger_ingestion(
    repo_id: uuid.UUID,
    current_user: CurrentUser,
    repo: RepositoryRepo,
    background_tasks: BackgroundTasks,
) -> dict:
    """Re-trigger ingestion for an existing repository."""
    repository = await repo.get_by_id(repo_id)
    if not repository or repository.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Repository not found.")
    await repo.update(repo_id, status=RepositoryStatus.PENDING)
    background_tasks.add_task(run_ingestion, repo_id)
    return {"message": "Ingestion queued.", "repository_id": str(repo_id)}


def _to_response(r: object) -> RepositoryResponse:
    return RepositoryResponse(
        id=str(getattr(r, "id", "")),
        name=getattr(r, "name", ""),
        url=getattr(r, "url", ""),
        description=getattr(r, "description", None),
        status=getattr(r, "status", ""),
        total_files=getattr(r, "total_files", 0),
        total_chunks=getattr(r, "total_chunks", 0),
        total_nodes=getattr(r, "total_nodes", 0),
        total_edges=getattr(r, "total_edges", 0),
        languages=getattr(r, "languages", {}),
        created_at=getattr(r, "created_at", datetime.now(UTC)).isoformat(),
        ingested_at=getattr(r, "ingested_at").isoformat()
        if getattr(r, "ingested_at", None)
        else None,
    )
