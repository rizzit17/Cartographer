import uuid
from typing import Any, Dict, List, Optional, TypedDict
from pydantic import BaseModel, Field

class Citation(BaseModel):
    file_path: str
    line_number: Optional[int] = None
    content: str
    score: Optional[float] = None

class TaskDependency(BaseModel):
    task_id: str
    depends_on: List[str]
    description: str
    expected_output: str
    required_context: List[str]
    risk_level: str

class PlannerOutput(BaseModel):
    tasks: List[TaskDependency]
    overall_risk: str
    reasoning: str

class BlastRadiusImpact(BaseModel):
    affected_files: List[str]
    affected_functions: List[str]
    dependency_depth: int
    confidence: float
    estimated_risk: str
    visualization_payload: Dict[str, Any]

class EditOperation(BaseModel):
    operation_type: str # SEARCH, REPLACE, INSERT, DELETE, MOVE
    file_path: str
    search_block: Optional[str] = None
    replace_block: Optional[str] = None
    insert_block: Optional[str] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None

class SandboxResult(BaseModel):
    status: str # PASS, FAIL, TIMEOUT, ERROR
    stdout: str
    stderr: str
    exit_code: int
    execution_time_sec: float
    coverage_report: Optional[str] = None
    test_report: Optional[str] = None
    git_diff: Optional[str] = None

class CriticFeedback(BaseModel):
    approved: bool
    confidence: float
    correctness_issues: List[str]
    architecture_issues: List[str]
    style_issues: List[str]
    complexity_issues: List[str]
    performance_issues: List[str]
    security_issues: List[str]
    regression_risks: List[str]
    missing_tests: List[str]
    reasoning: str

class ReflectionFeedback(BaseModel):
    failure_summary: str
    root_cause: str
    repair_plan: str
    improved_prompt: str
    should_retry: bool

class AgentState(TypedDict):
    """LangGraph workflow state for Cartographer multi-agent system."""
    session_id: uuid.UUID
    repository_id: uuid.UUID
    user_query: str
    conversation_history: List[Dict[str, Any]]
    
    # Context
    retrieval_context: List[Dict[str, Any]]
    graph_context: List[Dict[str, Any]]
    selected_files: List[str]
    selected_symbols: List[str]
    
    # Agent Outputs
    planner_output: Optional[PlannerOutput]
    blast_radius: Optional[BlastRadiusImpact]
    proposed_diff: Optional[str]
    edit_operations: List[EditOperation]
    
    # Sandbox & Validation
    sandbox_status: Optional[SandboxResult]
    test_results: Optional[Dict[str, Any]]
    critic_feedback: Optional[CriticFeedback]
    reflection_feedback: Optional[ReflectionFeedback]
    execution_logs: List[Dict[str, Any]]
    
    # Orchestration State
    current_agent: str
    next_agent: Optional[str]
    retry_count: int
    confidence_score: float
    
    # Observability & Metrics
    latency_metrics: Dict[str, float]
    token_usage: Dict[str, int]
    memory_summary: str
    citations: List[Citation]
    stream_events: List[Dict[str, Any]]
    errors: List[str]
