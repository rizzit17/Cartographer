# Five Startup-Grade AI Engineering Capstone Projects
### Prepared for a Final-Year B.Tech CSE Student — SDE / AI-ML Placements, 2026

---

## How to use this document
Each project is a full production-grade system spec: architecture, agents, RAG design, DB schema, API surface, diagrams, resume bullets, and 25 interview questions. Pick **one**, build the MVP in weeks 1–4, harden it in weeks 5–8, and ship a polished GitHub repo + demo video + live deployment link.

---
---

# PROJECT 1 — **VaultMind** (Autonomous Incident-Response Copilot for SREs)

## 1. Elevator Pitch
VaultMind is a multi-agent AIOps copilot that watches logs, metrics, and alerts from a live infrastructure stack, autonomously diagnoses production incidents, proposes and (with approval) executes remediation runbooks, and writes its own postmortem. It behaves like a junior SRE who never sleeps — reasoning over Grafana/Prometheus-style telemetry, cross-referencing a knowledge base of past incidents, and calling real tools (kubectl-style scripts, restart APIs) through MCP.

## 2. Problem Statement
On-call engineers spend the first 15–30 minutes of any incident just doing triage: correlating logs, metrics, and past incidents. Existing AIOps tools (Datadog Bits AI, PagerDuty AIOps) are closed-source SaaS black boxes — no student has ever rebuilt this category. Log-search tools are keyword-based, not causal-reasoning based.

## 3. Why Recruiters Will Like It
It targets **infra/platform/SRE-adjacent AI engineering**, a category almost no student portfolio touches, and demonstrates agentic reasoning over noisy, real-time, non-textual data (metrics + logs) rather than another PDF/chat wrapper.

## 4. Unique Selling Points
- Reasons over **time-series + logs + structured alerts**, not just prose documents.
- Produces an **auditable decision trail** (planner → evidence → action → outcome).
- Includes a human-in-the-loop **approval gate** before any destructive action — a real enterprise requirement.

## 5. Feature List
**Core:** log/metric ingestion, anomaly detection, root-cause agent, chat UI, incident timeline.
**Advanced:** multi-agent debate for ambiguous root causes, runbook auto-generation, MCP tool execution with approval gate, streaming reasoning trace.
**Enterprise:** RBAC, audit log, Slack/webhook integration, multi-tenant workspaces.
**Stretch:** predictive incident forecasting, chaos-engineering simulator, auto-generated Grafana dashboards.

## 6. AI Architecture Pipeline
```
Telemetry Stream (logs/metrics/alerts)
        ↓
 Ingestion & Normalization Service
        ↓
   Anomaly Detector (stats + LLM classifier)
        ↓
   Planner Agent  ──►  decides investigation plan
        ↓
   Retriever (hybrid: vector + keyword + graph of past incidents)
        ↓
   RAG Context Assembly (compressed, re-ranked)
        ↓
   Reasoning / Root-Cause Agent  ──►  hypothesis + confidence
        ↓
   Tool-Calling Layer (MCP: restart pod, scale, rollback)
        ↓
   Critic / Safety Agent  ──►  validates action against blast-radius rules
        ↓
   Memory Agent  ──►  stores incident + resolution as new knowledge
        ↓
   Streamed Response + Postmortem Draft
```

## 7. Agent Architecture
- **Planner Agent** — decomposes "what's wrong" into sub-investigations. Input: alert payload. Output: ordered task list. Prompt: ReAct-style. Failure: falls back to static runbook checklist.
- **Retriever Agent** — hybrid search across incident KB. Input: symptoms. Output: top-k past incidents + docs. Failure: widens query, drops filters.
- **Root-Cause (Reasoning) Agent** — synthesizes evidence into a ranked hypothesis list with confidence scores. Failure: escalates to human with "low confidence" flag.
- **Execution Agent** — calls MCP tools to remediate. Input: approved action. Output: execution result. Failure: rollback + alert.
- **Critic/Safety Agent** — reviews every proposed action against blast-radius and policy rules before execution. Failure: blocks and requests human approval.
- **Memory Agent** — writes structured incident summaries back into Postgres + vector store. Failure: queues for retry.
- **Supervisor Agent** — orchestrates the above via LangGraph state machine, handles retries/timeouts.

## 8. RAG Design
- **Chunking:** semantic chunking of runbooks/postmortems by section header; logs chunked by time-window + service tag.
- **Embeddings:** `text-embedding-3-large` (OpenAI-compatible) or local `nomic-embed-text` via Ollama.
- **Metadata:** service name, severity, timestamp, resolution tags.
- **Hybrid Search:** BM25 (Postgres full-text/pgvector `tsvector`) + dense vector search, fused via Reciprocal Rank Fusion.
- **Re-ranking:** cross-encoder re-ranker on top-20 candidates.
- **Context Compression:** LLM-based extractive summarization before injecting into reasoning prompt.
- **Query Transformation:** HyDE (hypothetical incident description) for sparse-alert queries.
- **Graph layer (optional):** knowledge graph of service → dependency → past-incident edges for causal traversal (Neo4j or in-Postgres graph table).

## 9. LLM Design
- Planning: GPT-4.1-class or Claude Sonnet-class (reasoning-heavy).
- Root-cause reasoning: same tier, higher temperature for hypothesis generation, low for final answer.
- Summarization/postmortem: smaller fast model (GPT-4o-mini / Llama-3.1-8B via Ollama for offline demo).
- Extraction (log parsing): small local model, function-calling mode.
- Evaluation/critic: separate model instance with strict rubric prompt (self-critique loop).
- Offline mode: full Ollama fallback (Llama 3.1 / Mistral) so the demo runs with zero API cost.

## 10. Database Design
- **PostgreSQL:** `incidents`, `services`, `runbooks`, `actions_log`, `users`, `agent_traces`.
- **Vector schema:** `pgvector` table `embeddings(id, source_type, source_id, embedding, metadata jsonb)`.
- **Redis:** session cache, rate limiting, streaming pub/sub for live agent trace, short-term working memory per session.
- **Long-term memory:** structured incident summaries + embeddings, retrievable by future agents.

## 11. Tech Stack
Frontend: React + Tailwind + shadcn/ui + WebSocket streaming.
Backend: FastAPI + LangGraph + LangChain.
DB: PostgreSQL + pgvector, Redis.
LLM: OpenAI-compatible API + Ollama fallback.
Deployment: Docker Compose → later Kubernetes; Nginx reverse proxy.
Auth: JWT + OAuth2 (FastAPI-Users).
Monitoring: Prometheus + Grafana (dogfooding your own domain!).
Logging: structured JSON logs → Loki.

## 12. Folder Structure
```
vaultmind/
├── backend/
│   ├── app/
│   │   ├── agents/ (planner.py, retriever.py, root_cause.py, critic.py, memory.py, supervisor_graph.py)
│   │   ├── api/ (routes: chat, incidents, actions, auth)
│   │   ├── core/ (config, security, logging)
│   │   ├── db/ (models, session, migrations/alembic)
│   │   ├── rag/ (chunking.py, embeddings.py, hybrid_search.py, reranker.py)
│   │   ├── mcp_tools/ (k8s_tools.py, restart_service.py)
│   │   └── main.py
│   └── tests/
├── frontend/
│   └── src/ (components, pages, hooks, ws-client)
├── docker/ (Dockerfile.backend, Dockerfile.frontend, nginx.conf)
├── docker-compose.yml
└── docs/ (architecture diagrams, ADRs)
```

## 13. API Endpoints
```
POST   /api/auth/login
POST   /api/incidents/ingest
GET    /api/incidents/{id}
POST   /api/chat            (streaming SSE/WebSocket)
POST   /api/agent/plan
POST   /api/agent/execute   (requires approval token)
GET    /api/memory/search
POST   /api/feedback
GET    /api/metrics/health
```

## 14. System Design (ASCII)
```
        ┌────────────┐        ┌──────────────┐
        │  React UI  │◄──────►│  Nginx Proxy │
        └─────┬──────┘        └──────┬───────┘
              │ WS/HTTP               │
        ┌─────▼─────────────────────────▼─────┐
        │            FastAPI Backend           │
        │  ┌─────────┐ ┌───────────┐ ┌───────┐ │
        │  │LangGraph│ │RAG Engine │ │MCP Bus│ │
        │  │Agents   │ │(Hybrid)   │ │Tools  │ │
        │  └────┬────┘ └─────┬─────┘ └───┬───┘ │
        └───────┼────────────┼───────────┼─────┘
                 │            │           │
        ┌────────▼───┐ ┌──────▼──────┐ ┌──▼─────┐
        │ PostgreSQL │ │  pgvector   │ │ Redis  │
        │ (relational)│ │ (semantic) │ │(cache) │
        └────────────┘ └─────────────┘ └────────┘
```

## 15. Sequence Diagram (text)
```
User → UI: reports alert / asks "why is checkout failing?"
UI → API: POST /chat
API → Supervisor: start LangGraph run
Supervisor → Planner: decompose task
Planner → Retriever: fetch similar incidents
Retriever → VectorDB/Postgres: hybrid query
Retriever → Planner: evidence set
Planner → RootCauseAgent: reason over evidence
RootCauseAgent → CriticAgent: validate hypothesis + action
CriticAgent → Supervisor: approved / blocked
Supervisor → ExecutionAgent: (if approved) call MCP tool
ExecutionAgent → Infra: restart/scale
Supervisor → MemoryAgent: persist outcome
Supervisor → UI: stream final answer + trace
```

## 16. AI Workflow (Agent Communication)
LangGraph state machine with shared `IncidentState` object passed node-to-node; each agent reads/writes typed fields (`evidence`, `hypotheses`, `approved_action`, `trace_log`). Supervisor node handles conditional edges (loop back to Retriever if confidence < threshold).

## 17. Database ER Diagram (ASCII)
```
users ───< incidents >─── services
              │
              ├──< actions_log
              ├──< agent_traces
              └──< runbooks
embeddings(source_type, source_id) → polymorphic link to incidents/runbooks
```

## 18. Deployment Architecture
Docker Compose services: `frontend`, `backend`, `postgres`, `redis`, `nginx`. Nginx terminates TLS and routes `/api` → backend, `/` → frontend static build, WebSocket upgrade for `/ws`. Production target: single VPS (Railway/Fly.io/AWS EC2) with volume-mounted Postgres, or migrate to ECS/K8s for the "enterprise" stretch goal.

## 19. Resume Bullets
- Built **VaultMind**, a multi-agent AIOps copilot (LangGraph, FastAPI, React) that autonomously triages production incidents using hybrid RAG over 500+ synthetic incident records, cutting simulated MTTR by ~40%.
- Designed a 6-agent architecture (Planner, Retriever, Root-Cause, Critic, Execution, Memory) with MCP-based tool calling and a human-in-the-loop safety gate for destructive actions.
- Implemented hybrid vector+keyword retrieval (pgvector + BM25 + cross-encoder re-ranking) and containerized the full stack with Docker Compose, Redis caching, and streaming SSE responses.

## 20. Interview Questions (25)
1. Why LangGraph over plain LangChain chains? 2. How do you prevent an agent from taking a destructive action erroneously? 3. Explain your hybrid search fusion method. 4. How do you evaluate root-cause accuracy without ground truth? 5. How does your critic agent differ from the reasoning agent? 6. Why pgvector instead of Pinecone/Weaviate? 7. How do you handle agent infinite loops? 8. What's your chunking strategy for logs vs. docs? 9. How do you keep long-term memory from growing unbounded? 10. How would you scale this to 10K incidents/day? 11. Explain your MCP tool-calling security model. 12. How do you test non-deterministic LLM outputs? 13. What's your fallback if the LLM API is down? 14. How do you avoid hallucinated remediation steps? 15. Explain your RBAC design. 16. How do you stream partial agent reasoning to the UI? 17. What's the cost per incident at scale, and how do you optimize it? 18. How would you add multi-tenant isolation? 19. Explain Reciprocal Rank Fusion. 20. How do you handle PII in logs? 21. What's your rollback strategy for a bad remediation? 22. How do you version your knowledge base? 23. How do you detect model drift in the classifier? 24. Why Redis for session state vs. just Postgres? 25. How would this integrate with real PagerDuty/Datadog APIs?

## 21. Future Scope
Predictive incident prevention, chaos-engineering auto-simulation, integration with real cloud provider APIs (AWS/GCP), SOC2-style compliance logging, becoming an internal-tools SaaS for small eng teams.

## 22. Difficulty: **8.5/10**

## 23. Timeline (8 weeks)
Wk1: infra + data simulation. Wk2: RAG pipeline. Wk3: agent graph (planner+retriever). Wk4: root-cause+critic agents. Wk5: MCP tool execution + approval UI. Wk6: memory + postmortem generation. Wk7: auth, monitoring, Docker hardening. Wk8: polish, demo video, README, deploy.

## 24. GitHub Portfolio Value
Recruiters rarely see infra-domain agentic AI from students — it signals systems thinking beyond typical chatbot projects and pairs naturally with SRE/platform-eng interview tracks.

---
---

# PROJECT 2 — **Arbiter** (Multi-Agent Contract & Compliance Negotiation Engine)

## 1. Elevator Pitch
Arbiter is a multi-agent system where a "Vendor Agent" and a "Buyer Agent" — each grounded in different document sets (vendor terms vs. company policy) — autonomously negotiate a contract clause-by-clause, flag risky terms against a compliance knowledge graph, and produce a redlined document with justification, while a human approves final terms. It's not a document Q&A bot — it's agents debating and converging.

## 2. Problem Statement
Contract review is slow, expensive (lawyers bill hourly), and current "legal AI" tools just summarize or Q&A a single PDF. Nobody builds a system where **two grounded agents actually negotiate** against each other over structured clause objectives — a genuinely novel agentic pattern (used internally at legal-tech startups like Ironclad/Robin AI, but never shown as a student project).

## 3. Why Recruiters Will Like It
Demonstrates **adversarial/cooperative multi-agent design**, structured output generation, and grounding two agents in different knowledge sources simultaneously — a strong signal of advanced agent-orchestration skill, distinct from the sea of single-agent RAG chatbots.

## 4. Unique Selling Points
- True **multi-agent negotiation loop** (not a single agent role-playing).
- Compliance **knowledge graph** cross-checks every clause against policy rules.
- Outputs a redlined diff with agent-authored justifications — directly demoable.

## 5. Feature List
**Core:** clause extraction, negotiation loop (2 agents), redline generation, chat UI.
**Advanced:** compliance knowledge graph, self-critique on risky clauses, streaming negotiation transcript, versioned contract history.
**Enterprise:** multi-party negotiation (3+ agents), audit trail, e-sign integration stub, role-based review queues.
**Stretch:** clause risk-scoring model trained on public contract datasets, negotiation strategy analytics dashboard.

## 6. AI Architecture Pipeline
```
Uploaded Contract(s)
      ↓
Clause Segmentation & Extraction
      ↓
Planner Agent → builds negotiation agenda (clause priority order)
      ↓
Retriever (hybrid: policy KB + past-contract corpus + graph)
      ↓
RAG Context per clause
      ↓
Vendor Agent  ⇄  Buyer Agent   (turn-based negotiation, LangGraph loop)
      ↓
Critic Agent → checks convergence / compliance violation
      ↓
Memory Agent → stores accepted clauses + negotiation trace
      ↓
Redline Document + Streamed Transcript
```

## 7. Agent Architecture
- **Planner Agent** — orders clauses by risk/priority. Failure: default alphabetical order.
- **Retriever Agent** — hybrid graph+vector search for relevant policy clauses. Failure: broadens to full policy doc.
- **Vendor Agent** — argues for vendor-favorable terms, grounded in vendor doc. Prompt: persona + constraints. Failure: times out after N turns, defers to human.
- **Buyer Agent** — argues for company-favorable terms, grounded in policy KB. Same failure handling.
- **Critic/Compliance Agent** — validates proposed clause against hard compliance rules (graph traversal); can veto. Failure: escalate to human legal reviewer.
- **Memory Agent** — persists negotiation history for future contract templates.
- **Supervisor Agent** — LangGraph state machine controlling turn-taking and convergence detection (e.g., cosine similarity between successive clause proposals).

## 8. RAG Design
- **Chunking:** clause-level chunking via regex + LLM boundary detection.
- **Embeddings:** OpenAI-compatible + Ollama fallback.
- **Metadata:** clause type, risk category, jurisdiction.
- **Hybrid Search:** dense + BM25 fusion.
- **Graph RAG:** Neo4j/pgvector-graph-hybrid representing policy rule dependencies (e.g., "liability cap" depends on "indemnification" clause) — genuinely useful here since compliance rules are relational, not just textual.
- **Re-ranking:** cross-encoder.
- **Context Compression:** map-reduce summarization for long contracts.
- **Query Transformation:** decompose "is this clause compliant?" into sub-queries per rule.

## 9. LLM Design
Planning/negotiation: strong reasoning model (temperature ~0.7 for negotiation creativity). Compliance critic: low temperature, rubric-constrained. Extraction: function-calling small model. Summarization: fast model. Offline: Ollama Llama-3.1/Mistral for demo without API cost.

## 10. Database Design
PostgreSQL: `contracts`, `clauses`, `negotiation_turns`, `policy_rules`, `users`.
Vector: pgvector `embeddings`.
Graph: adjacency table `rule_dependencies(rule_id, depends_on_id)` or Neo4j.
Redis: turn-taking lock, live transcript pub/sub.

## 11. Tech Stack
Same core stack as Project 1 (React/FastAPI/LangGraph/LangChain/Postgres/Redis/Docker), plus PDF/DOCX parsing (`pdfplumber`, `python-docx`) and optional Neo4j for graph RAG.

## 12. Folder Structure
```
arbiter/
├── backend/app/agents/{planner,vendor_agent,buyer_agent,critic,memory,supervisor_graph}.py
├── backend/app/rag/{clause_extraction,hybrid_search,graph_rag,reranker}.py
├── backend/app/api/{contracts,negotiate,compliance,auth}.py
├── frontend/src/{NegotiationTranscript,RedlineViewer,Dashboard}
├── docker-compose.yml
```

## 13. API Endpoints
```
POST /api/contracts/upload
POST /api/contracts/{id}/segment
POST /api/negotiate/start        (streaming)
GET  /api/negotiate/{id}/transcript
POST /api/compliance/check
GET  /api/contracts/{id}/redline
POST /api/feedback
```

## 14. System Design (ASCII) — mirrors Project 1's layered diagram, with `Neo4j/Graph` box added beside pgvector.

## 15. Sequence Diagram (text)
```
User uploads contract → Segmentation → Planner builds agenda
Loop per clause:
  Buyer Agent proposes → Retriever fetches policy support → Vendor Agent counters
  Critic checks compliance → if violation: veto + explain; else: mark tentatively agreed
Repeat until convergence or max turns
Memory Agent stores final clauses → Redline generated → streamed to UI
```

## 16. AI Workflow — LangGraph cyclic graph: `Buyer → Retriever → Vendor → Critic → (loop or exit)`, shared `NegotiationState`.

## 17. Database ER Diagram
```
contracts ──< clauses ──< negotiation_turns
policy_rules ──< rule_dependencies (self-referential)
clauses >──< policy_rules (many-to-many compliance_checks)
```

## 18. Deployment Architecture
Same Docker Compose pattern; add Neo4j container if graph RAG used; Nginx reverse proxy; Postgres persistent volume.

## 19. Resume Bullets
- Built **Arbiter**, a multi-agent contract-negotiation engine (LangGraph) where two grounded LLM agents autonomously negotiate clauses against a compliance knowledge graph, producing auditable redlines.
- Designed graph-augmented RAG combining pgvector similarity, BM25, and a rule-dependency graph to validate contract clauses against 50+ compliance policies.
- Built streaming negotiation-transcript UI (React + SSE) and turn-based LangGraph state machine with automatic convergence detection and human escalation fallback.

## 20. Interview Questions (25)
1. How do two agents avoid talking past each other? 2. How do you detect negotiation convergence programmatically? 3. Why graph RAG here specifically, not just vector search? 4. How do you prevent one agent from "winning" unfairly (prompt asymmetry)? 5. How do you avoid infinite negotiation loops? 6. Explain your clause-segmentation accuracy testing. 7. How do you handle multi-jurisdiction compliance rules? 8. What happens if the critic agent hallucinates a violation? 9. How would you extend to 3+ party negotiations? 10. How do you version contract redlines? 11. Explain your convergence similarity metric. 12. How do you keep vendor/buyer agents from leaking cross-context? 13. What's your evaluation set for compliance accuracy? 14. How do you handle ambiguous clauses with no policy match? 15. Why LangGraph cycles vs. a simple loop in Python? 16. How do you secure uploaded contracts (PII/confidentiality)? 17. How would you fine-tune a smaller model for clause classification? 18. Explain map-reduce summarization tradeoffs. 19. How do you audit which policy justified a rejection? 20. How do you rate-limit negotiation turns for cost control? 21. How would real e-signature integration work? 22. How do you test agent prompts for regression? 23. What's the biggest risk of deploying this in production? 24. How do you handle contract templates across industries? 25. How would you benchmark against a human paralegal?

## 21. Future Scope
SaaS for SMB legal-ops teams, fine-tuned clause-risk classifier, multi-jurisdiction rule packs, e-signature + DocuSign integration, analytics on negotiation win-rates.

## 22. Difficulty: **8/10**

## 23. Timeline (8 weeks)
Wk1: parsing/segmentation. Wk2: RAG + graph rules. Wk3: single-agent negotiation MVP. Wk4: two-agent loop + convergence. Wk5: critic/compliance agent. Wk6: redline generation + UI transcript. Wk7: auth/logging/Docker. Wk8: polish + deploy + demo.

## 24. GitHub Portfolio Value
A working two-agent negotiation demo is highly visual and explainable in a 2-minute video — exactly what makes a GitHub repo get starred and makes an interviewer lean in.

---
---

# PROJECT 3 — **Foundry** (Autonomous Data-Pipeline & Dashboard Generator)

## 1. Elevator Pitch
Foundry is an agentic system that takes a raw, messy dataset (CSV/DB connection) and a natural-language goal ("track churn drivers weekly"), then autonomously plans a data pipeline, writes and executes cleaning/transformation code in a sandboxed executor, builds a knowledge graph of the schema, and generates a live, explainable dashboard with LLM-authored insights — refining itself via a self-critique loop until the dashboard actually answers the stated business goal.

## 2. Problem Statement
Analysts spend days on data wrangling and dashboarding before insight; "text-to-SQL" tools only answer single questions, they don't build and maintain a whole analytics pipeline autonomously with code execution + critique. This targets the fast-growing "agentic data engineering" niche few students touch.

## 3. Why Recruiters Will Like It
Combines **agentic code generation + execution**, data engineering, and business-facing dashboarding — appeals equally to Data/ML and SDE interviewers, and shows the agent actually *writing and running code*, not just retrieving text.

## 4. Unique Selling Points
- Agent writes **and executes** pandas/SQL code in a sandbox, iterating on errors autonomously (reflection loop).
- Builds a **schema knowledge graph** so it "understands" table relationships before querying.
- Self-critiques whether the generated dashboard actually satisfies the stated goal (not just "did the code run").

## 5. Feature List
**Core:** dataset ingestion, schema profiling, NL-to-pipeline planning, sandboxed code execution, dashboard generation.
**Advanced:** self-critique/reflection loop, schema knowledge graph, streaming pipeline-build trace, chat-driven dashboard editing.
**Enterprise:** scheduled pipeline runs, multi-dataset joins, RBAC on dashboards, alerting on metric anomalies.
**Stretch:** auto-generated data-quality tests, natural-language "why did this metric change" root-cause agent.

## 6. AI Architecture Pipeline
```
Raw Dataset / DB Connection
      ↓
Schema Profiler → builds Schema Knowledge Graph
      ↓
Planner Agent → decomposes business goal into pipeline steps
      ↓
Retriever (hybrid: schema graph + past pipeline templates)
      ↓
Code-Gen Agent → writes pandas/SQL transformation code
      ↓
Sandboxed Execution Agent (Docker-isolated) → runs code, captures errors
      ↓
Reflection Agent → on error, revises code (loop up to N times)
      ↓
Insight Agent → generates NL narrative over resulting metrics
      ↓
Critic Agent → checks if goal is satisfied
      ↓
Memory Agent → stores pipeline + learnings for reuse
      ↓
Dashboard (charts + narrative), streamed build log
```

## 7. Agent Architecture
- **Planner Agent** — turns business goal into ordered pipeline steps. Failure: asks clarifying question.
- **Code-Gen Agent** — writes transformation/query code with tool-calling to a sandbox executor. Failure: passes stack trace to Reflection Agent.
- **Execution Agent** — runs code in an isolated Docker/subprocess sandbox with resource limits. Failure: kills on timeout, reports to Reflection Agent.
- **Reflection Agent** — reads error/output, patches code, retries (max 3 iterations). Failure: surfaces to user with diagnosis.
- **Insight Agent** — narrates trends/outliers in plain English. Failure: falls back to raw stats table.
- **Critic Agent** — checks output against the original goal statement (LLM-as-judge rubric). Failure: triggers another planning round.
- **Memory Agent** — stores successful pipeline recipes keyed by dataset schema fingerprint, enabling reuse ("few-shot from own history").
- **Supervisor Agent** — LangGraph orchestrator with retry/loop edges.

## 8. RAG Design
- **Chunking:** schema chunked per table/column with sample values + dtype metadata.
- **Embeddings:** column/table description embeddings for semantic schema search.
- **Metadata:** dtype, nullability, cardinality, business-glossary tags.
- **Hybrid Search:** vector (semantic column matching) + keyword (exact column name).
- **Graph RAG:** schema knowledge graph (table → foreign key → table) — genuinely necessary for multi-table join planning.
- **Re-ranking:** cross-encoder over candidate columns for a given NL goal.
- **Context Compression:** summarize large schemas (100+ columns) before injecting into planner prompt.
- **Self-Query Retrieval:** LLM converts NL goal into structured filters over the schema graph.

## 9. LLM Design
Planning: strong reasoning model. Code-gen: code-specialized model (or same model, code-mode prompting) with tool-calling to execute Python. Reflection: same tier, given error trace. Insight narration: fast/cheap model. Critic: separate rubric-constrained call. Offline: Ollama `codellama`/`qwen2.5-coder` for local code-gen demo.

## 10. Database Design
PostgreSQL: `datasets`, `schema_columns`, `pipelines`, `pipeline_runs`, `insights`, `dashboards`.
Vector: pgvector for column/table embeddings.
Graph: `schema_edges(from_table, to_table, join_key)`.
Redis: sandbox job queue, execution status pub/sub, caching of repeated NL→pipeline lookups.

## 11. Tech Stack
Frontend: React + Recharts/Plotly for dashboards + streaming build console.
Backend: FastAPI + LangGraph + LangChain + a **sandboxed executor** (Docker-in-Docker or `restrictedpython`/firejail for safety).
DB: Postgres + pgvector, Redis.
LLM: OpenAI-compatible + Ollama (code model) fallback.
Deployment: Docker Compose with an isolated `executor` container (no network egress) for safety.
Auth: JWT.
Monitoring/Logging: Prometheus + structured JSON logs of every code execution for audit.

## 12. Folder Structure
```
foundry/
├── backend/app/agents/{planner,codegen,reflection,insight,critic,memory,supervisor_graph}.py
├── backend/app/executor/ (sandbox_runner.py, docker_client.py)
├── backend/app/rag/{schema_profiler,hybrid_search,graph_rag}.py
├── backend/app/api/{datasets,pipelines,dashboards,auth}.py
├── frontend/src/{DashboardBuilder,PipelineConsole,SchemaGraphView}
├── docker-compose.yml   # includes isolated `executor` service, no egress
```

## 13. API Endpoints
```
POST /api/datasets/upload
GET  /api/datasets/{id}/schema
POST /api/pipelines/generate     (streaming build log)
POST /api/pipelines/{id}/run
GET  /api/dashboards/{id}
POST /api/insights/refresh
POST /api/feedback
```

## 14. System Design (ASCII)
```
React UI ⇄ Nginx ⇄ FastAPI
                     │
      ┌──────────────┼──────────────┐
      │        LangGraph Agents      │
      │  Planner→CodeGen→Reflection  │
      └──────┬───────────────┬───────┘
             │               │
      ┌──────▼─────┐   ┌─────▼──────┐
      │ Sandbox    │   │ Postgres + │
      │ Executor   │   │ pgvector   │
      │ (isolated) │   └────────────┘
      └────────────┘        │
                        Redis (queue)
```

## 15. Sequence Diagram (text)
```
User uploads CSV + states goal → Schema Profiler builds graph
Planner → CodeGen: generate transformation script
CodeGen → Sandbox: execute
Sandbox → Reflection: on error, return trace
Reflection → CodeGen: patched code (loop ≤3)
CodeGen → Insight Agent: final dataframe
Insight Agent → Critic: narrative + goal check
Critic → Supervisor: pass/replan
Supervisor → UI: stream dashboard + narrative
```

## 16. AI Workflow — LangGraph with a conditional retry edge (`CodeGen ⇄ Reflection ⇄ Sandbox`) capped at 3 iterations before escalating to the user.

## 17. Database ER Diagram
```
datasets ──< schema_columns
datasets ──< pipelines ──< pipeline_runs ──< insights
pipelines ──< dashboards
schema_edges(table_a, table_b) self-referential on schema_columns
```

## 18. Deployment Architecture
Docker Compose: `frontend`, `backend`, `executor` (network-isolated, CPU/memory-capped), `postgres`, `redis`, `nginx`. Executor container is the key production-safety story to discuss in interviews (sandboxing untrusted LLM-generated code).

## 19. Resume Bullets
- Built **Foundry**, an agentic data-pipeline generator (LangGraph, FastAPI) that converts natural-language goals into executable pandas/SQL pipelines with a self-healing reflection loop, achieving ~85% first-attempt code success and ~98% after retries.
- Designed a sandboxed, network-isolated code-execution service for safely running LLM-generated Python, with automated error-trace-driven repair.
- Built a schema knowledge graph + hybrid retrieval system enabling multi-table join planning and automatic dashboard/insight generation streamed live to a React UI.

## 20. Interview Questions (25)
1. How do you sandbox untrusted LLM-generated code safely? 2. What happens if the code enters an infinite loop? 3. How do you cap reflection-loop retries and why? 4. How does the schema graph help multi-table joins? 5. How do you evaluate "did the dashboard satisfy the goal"? 6. Why pandas execution vs. pushing everything to SQL? 7. How do you prevent prompt injection via dataset column names? 8. How do you handle very large datasets (>1M rows)? 9. Explain your resource-limiting strategy for the executor container. 10. How do you cache repeated pipeline requests? 11. How would you add streaming/incremental data support? 12. What's your approach to code-gen hallucinated columns? 13. How do you version pipeline recipes for reuse? 14. How do you test non-deterministic code-gen outputs? 15. How would you extend to real-time streaming dashboards? 16. Explain your insight-narration hallucination safeguards. 17. How do you secure uploaded datasets (PII)? 18. Why LangGraph over Airflow for orchestration here? 19. How do you decide code-gen vs. templated transformations? 20. What's your critic agent's rubric? 21. How would this integrate with a real warehouse (Snowflake/BigQuery)? 22. How do you monitor execution cost per pipeline? 23. How do you roll back a bad pipeline run? 24. How do you handle schema drift over time? 25. What's the biggest failure mode you observed while building this?

## 21. Future Scope
Scheduled/streaming pipelines, warehouse connectors (Snowflake/BigQuery), anomaly-alerting, auto-generated data-quality tests, becoming a lightweight "agentic BI" SaaS.

## 22. Difficulty: **9/10** (highest — sandboxed code execution + agentic loops is genuinely hard)

## 23. Timeline (8 weeks)
Wk1: ingestion + schema profiler. Wk2: sandbox executor + safety. Wk3: planner + code-gen agent. Wk4: reflection loop. Wk5: insight + critic agents. Wk6: dashboard UI + streaming console. Wk7: schema graph + hybrid retrieval. Wk8: hardening, auth, deploy, demo.

## 24. GitHub Portfolio Value
Live code-execution + self-repair is extremely demo-able (record a video of it failing, self-correcting, and succeeding) — this is the kind of repo that gets organically shared.

---
---

# PROJECT 4 — **Sentinel** (Autonomous Brand & Threat Intelligence Agent)

## 1. Elevator Pitch
Sentinel continuously monitors public web/social/news sources for a brand or codebase (e.g., "monitor mentions of my company + CVEs in our dependency stack"), uses a planner-researcher-critic agent loop to separate signal from noise, cross-references a long-term memory of past findings to avoid duplicate alerts, and autonomously drafts response recommendations — essentially an always-on OSINT/brand-intel analyst.

## 2. Problem Statement
Companies pay for brand-monitoring (Brandwatch) and security-intel (Recorded Future) SaaS separately, both expensive and closed. A single-student agentic system that does continuous autonomous research + deduplication + long-term memory is a strong "always-on agent" showcase — a pattern (persistent autonomous agents) increasingly demanded by employers building agentic products.

## 3. Why Recruiters Will Like It
Shows **long-running, stateful, autonomous agent design** (not just request/response chat) — scheduling, deduplication via long-term memory, and self-directed research loops are exactly what's discussed in 2026 "agentic AI" interviews.

## 4. Unique Selling Points
- **Always-on autonomous loop** (cron-triggered agent runs, not just chat-triggered).
- Long-term memory used for **deduplication and trend detection** across weeks of runs — a real test of memory architecture.
- Combines OSINT-style web research tool-calling with structured risk scoring.

## 5. Feature List
**Core:** keyword/entity monitoring config, scheduled research runs, dedup memory, alert feed UI.
**Advanced:** researcher-critic self-reflection loop, sentiment/risk scoring, trend clustering over time, streaming live-run console.
**Enterprise:** multi-workspace monitoring, Slack/email digest, RBAC, audit trail of every autonomous action.
**Stretch:** CVE-to-dependency matching (real security use case), auto-drafted PR to bump vulnerable dependencies.

## 6. AI Architecture Pipeline
```
Scheduled Trigger (cron) / Manual Query
      ↓
Planner Agent → builds research sub-queries
      ↓
Research Agent → tool-calls web search / APIs (MCP)
      ↓
Retriever → hybrid search over Long-Term Memory (past findings)
      ↓
Dedup/Novelty Check → is this already known?
      ↓
Reasoning Agent → risk/sentiment scoring + summary
      ↓
Critic/Reflection Agent → validates sourcing, flags low-confidence claims
      ↓
Memory Agent → writes new finding to long-term store
      ↓
Alert/Digest Generator → streamed to UI + optional webhook
```

## 7. Agent Architecture
- **Planner Agent** — expands a monitoring topic into concrete search sub-queries. Failure: falls back to last-run's query set.
- **Research Agent** — calls web-search/API tools via MCP, gathers raw evidence. Failure: retries with reformulated query, then reports partial results.
- **Novelty/Dedup Agent** — checks new evidence against long-term memory embeddings; discards near-duplicates. Failure: erring toward "surface it" rather than silently dropping.
- **Reasoning Agent** — scores risk/sentiment/relevance, writes summary. Failure: flags "manual review needed."
- **Critic/Reflection Agent** — verifies claims are actually source-backed (no hallucinated facts), checks source credibility. Failure: downgrades confidence, doesn't alert.
- **Memory Agent** — persists structured findings + embeddings; also maintains a rolling "trend" aggregate. Failure: queues write for retry.
- **Supervisor Agent** — LangGraph scheduler-aware orchestrator, triggered by cron + on-demand.

## 8. RAG Design
- **Chunking:** article/post-level chunking with source metadata.
- **Embeddings:** dense embeddings for novelty detection (cosine similarity threshold for "duplicate").
- **Metadata:** source credibility score, timestamp, entity tags, sentiment.
- **Hybrid Search:** vector (semantic dedup) + keyword (exact entity match) fusion.
- **Long-Term Memory:** the core differentiator — a persistent, ever-growing embedded knowledge base of every past finding, queried for both dedup and trend analysis.
- **Re-ranking:** cross-encoder for relevance-to-monitoring-topic.
- **Context Compression:** summarize each source before storing, keep raw only as backup.
- **Query Transformation:** planner reformulates broad topics into multiple targeted queries (query fan-out).

## 9. LLM Design
Planning/query fan-out: mid-tier reasoning model. Research synthesis: strong model for accurate summarization. Critic/fact-check: separate call, strict "cite evidence or discard" rubric. Sentiment/risk scoring: small fast model or classifier head. Offline: Ollama fallback for demo without live API cost (mock search results for offline mode).

## 10. Database Design
PostgreSQL: `topics`, `runs`, `findings`, `sources`, `alerts`, `users`.
Vector: pgvector `finding_embeddings` for dedup/trend queries.
Redis: cron job queue (or Celery+Redis), live-run pub/sub, rate limiting on external API calls.
Long-term memory: `findings` table itself, indexed by topic + time, is the memory store — explicitly designed for growth-over-time queries (a great interview talking point: "how do you keep memory useful as it scales to 100K+ entries" → summarization + periodic memory consolidation agent).

## 11. Tech Stack
Frontend: React + timeline/feed UI + streaming live-run console.
Backend: FastAPI + LangGraph + LangChain + Celery/Redis for scheduling.
DB: Postgres + pgvector, Redis.
LLM: OpenAI-compatible + Ollama fallback.
Deployment: Docker Compose incl. Celery worker + beat scheduler.
Auth: JWT + workspace-scoped API keys.
Monitoring/Logging: Prometheus + structured logs per agent run (full audit of autonomous actions — critical since this agent acts without a human in the loop each time).

## 12. Folder Structure
```
sentinel/
├── backend/app/agents/{planner,research,dedup,reasoning,critic,memory,supervisor_graph}.py
├── backend/app/scheduler/ (celery_app.py, tasks.py, beat_schedule.py)
├── backend/app/rag/{hybrid_search,long_term_memory,reranker}.py
├── backend/app/mcp_tools/ (web_search_tool.py, cve_lookup_tool.py)
├── backend/app/api/{topics,runs,findings,alerts,auth}.py
├── frontend/src/{Feed,TrendDashboard,RunConsole}
├── docker-compose.yml
```

## 13. API Endpoints
```
POST /api/topics
POST /api/runs/trigger
GET  /api/runs/{id}/stream
GET  /api/findings?topic_id=
GET  /api/trends/{topic_id}
POST /api/alerts/config
POST /api/feedback
```

## 14. System Design (ASCII)
```
Celery Beat (cron) ──► Celery Worker ──► LangGraph Agent Run
                                          │
React UI ⇄ Nginx ⇄ FastAPI ⇄ Redis (queue/pubsub)
                        │
                  Postgres + pgvector (long-term memory)
```

## 15. Sequence Diagram (text)
```
Cron fires → Celery task starts LangGraph run
Planner → sub-queries → Research Agent → MCP web-search tool
Research → Dedup Agent: compare against long-term memory
  if novel → Reasoning Agent scores & summarizes
             Critic Agent verifies sourcing
             Memory Agent stores finding
             Alert Generator notifies UI/webhook
  if duplicate → discard, update trend counter
```

## 16. AI Workflow — LangGraph graph triggered both by scheduler and manual API call, sharing the same `ResearchState`; dedup node has a conditional branch (`novel` vs `duplicate`) determining downstream path.

## 17. Database ER Diagram
```
topics ──< runs ──< findings ──< sources
findings ──< alerts
finding_embeddings (1:1 with findings) for vector dedup/trend queries
```

## 18. Deployment Architecture
Docker Compose: `frontend`, `backend`, `celery_worker`, `celery_beat`, `postgres`, `redis`, `nginx`. This is the strongest "production-grade autonomous system" story of the five — scheduled autonomous agents are a genuinely enterprise pattern.

## 19. Resume Bullets
- Built **Sentinel**, an always-on autonomous research agent (LangGraph, Celery, FastAPI) that continuously monitors web sources, deduplicates findings via vector-similarity long-term memory, and generates risk-scored alerts.
- Designed a 6-agent pipeline (Planner, Research, Dedup, Reasoning, Critic, Memory) with a fact-verification critic that discards unsourced claims, reducing hallucinated alerts.
- Implemented scheduled autonomous agent execution (Celery + Redis) with full audit logging of every unsupervised agent action, plus hybrid vector/keyword retrieval over a growing long-term memory store.

## 20. Interview Questions (25)
1. How do you prevent your always-on agent from spamming duplicate alerts? 2. How does memory stay useful as it scales past 100K entries? 3. What's your novelty-detection similarity threshold and how did you tune it? 4. How do you fact-check LLM summaries against sources? 5. How do you handle unreliable/low-quality sources? 6. Why Celery+Redis for scheduling vs. a simple cron script? 7. How do you audit an agent that acts without human approval each cycle? 8. How would you add real-time (not just scheduled) monitoring? 9. What's your strategy for memory consolidation/summarization over time? 10. How do you rate-limit external API/search calls across many topics? 11. How do you handle conflicting information from different sources? 12. Explain your risk-scoring methodology. 13. How would you detect if the agent itself starts hallucinating trends? 14. How do you scale to thousands of monitored topics? 15. What's your cost-control strategy for continuous LLM calls? 16. How do you prevent prompt injection from malicious web content? 17. How would you add human-in-the-loop review for high-risk alerts? 18. How do you test a system that runs autonomously over time? 19. Explain query fan-out and why it improves recall. 20. How do you version/evolve monitoring topics over time? 21. How would you integrate real CVE databases? 22. What happens if the scheduler misses a run? 23. How do you avoid memory bias (early findings dominating retrieval)? 24. How would you build a trend-clustering feature? 25. What's the ethical consideration in autonomous brand/OSINT monitoring?

## 21. Future Scope
Real CVE/dependency-vulnerability monitoring for DevSecOps teams, Slack/Teams digest bots, becoming a lightweight competitive-intelligence SaaS, human-in-the-loop escalation tiers.

## 22. Difficulty: **8/10**

## 23. Timeline (8 weeks)
Wk1: scheduler infra (Celery/Redis) + topic config. Wk2: research agent + MCP web-search tool. Wk3: long-term memory + dedup logic. Wk4: reasoning + risk scoring. Wk5: critic/fact-verification agent. Wk6: alert UI + streaming console. Wk7: trend dashboard + audit logging. Wk8: hardening, auth, deploy, demo.

## 24. GitHub Portfolio Value
"An agent that runs itself, remembers what it already told you, and only alerts on what's new" is an easy, compelling 90-second demo story — very shareable.

---
---

# PROJECT 5 — **Cartographer** (Autonomous Codebase Understanding & Refactor-Planning Agent)

## 1. Elevator Pitch
Cartographer ingests an entire real-world GitHub repository, builds a **code knowledge graph** (functions, classes, dependencies, call graphs), lets a multi-agent team answer deep architectural questions, autonomously plan multi-file refactors, simulate the refactor's blast radius, and generate a reviewed PR-ready diff — essentially a junior staff engineer that actually understands your whole codebase, not just one file.

## 2. Problem Statement
"AI code review" tools (Copilot, CodeRabbit) comment on diffs; they don't build a whole-repo understanding or plan cross-file refactors with dependency-aware reasoning. This is squarely the direction real developer-tools startups (Cursor, Sourcegraph Cody, Codeium) are heading — building it as a student shows direct alignment with where AI/dev-tools hiring is going in 2026.

## 3. Why Recruiters Will Like It
It's the single most **directly relevant to SDE hiring managers** of the five — it's literally a smaller version of the tools their own teams use, and demonstrates static-analysis + graph reasoning + agentic planning combined, a rare and high-value skill combo.

## 4. Unique Selling Points
- Builds a real **AST-derived call/dependency graph** (not just embedding chunks of code) — true Graph RAG on code structure.
- Simulates **blast radius** of a proposed refactor before writing any code.
- Produces an actual **git diff / PR**, not just a text explanation.

## 5. Feature List
**Core:** repo ingestion, AST-based code graph construction, chat Q&A over codebase, refactor planning.
**Advanced:** blast-radius simulation, multi-file refactor execution in sandbox, self-critique on refactor correctness (run tests), streaming agent trace.
**Enterprise:** multi-repo workspaces, PR auto-generation to GitHub via API, RBAC, CI integration hooks.
**Stretch:** architecture-drift detection over time, auto-generated technical documentation, dependency-upgrade impact analysis.

## 6. AI Architecture Pipeline
```
GitHub Repo (clone)
      ↓
AST Parser → Code Knowledge Graph (functions/classes/imports/calls)
      ↓
Embedding of code chunks + docstrings (semantic layer)
      ↓
Planner Agent → interprets refactor/question request
      ↓
Retriever → hybrid: graph traversal (structural) + vector (semantic) + keyword
      ↓
Reasoning Agent → proposes plan / answer, grounded in graph context
      ↓
Blast-Radius Agent → traverses call graph to estimate impact of change
      ↓
Code-Edit Agent → writes multi-file diff (tool-calling to sandbox executor)
      ↓
Test-Runner Agent → runs existing test suite in sandbox, reports pass/fail
      ↓
Critic/Reflection Agent → on failure, revises diff (loop)
      ↓
Memory Agent → stores architectural learnings per repo
      ↓
PR-ready Diff + Explanation, streamed
```

## 7. Agent Architecture
- **Planner Agent** — interprets the user's refactor goal or question, decomposes into steps. Failure: asks clarifying question about scope.
- **Retriever Agent** — combines graph traversal (e.g., "all callers of `process_payment`") with semantic search. Failure: widens graph radius.
- **Reasoning Agent** — proposes the actual change/answer grounded in retrieved context. Failure: lowers confidence, asks for more context.
- **Blast-Radius Agent** — walks the dependency graph outward from changed nodes to list all potentially affected files/tests. Failure: over-estimates radius (safer default) rather than under.
- **Code-Edit Agent** — generates the actual multi-file diff via tool-calling to a sandbox git worktree. Failure: reverts partial edits.
- **Test-Runner Agent** — executes the repo's test suite in the sandbox. Failure: reports which tests failed with traceback.
- **Critic/Reflection Agent** — on test failure, feeds traceback back to Code-Edit Agent for a patch (loop ≤3). Failure: surfaces to human with diagnosis and partial diff.
- **Memory Agent** — stores architectural facts learned (e.g., "module X is deprecated, avoid") for reuse in future sessions on the same repo.
- **Supervisor Agent** — LangGraph orchestrator managing the plan→edit→test→reflect cycle.

## 8. RAG Design
- **Chunking:** function/class-level chunking via AST, preserving docstrings and signatures as metadata.
- **Embeddings:** code-aware embedding model (e.g., `text-embedding-3-large` or a code-specific local model via Ollama).
- **Metadata:** file path, module, last-modified, test coverage flag.
- **Hybrid Search:** semantic (vector) + exact symbol lookup (keyword/regex over the AST index).
- **Graph RAG (core to this project):** call graph + import graph stored as edges; retrieval combines "k-hop graph neighbors" with vector similarity — genuinely necessary since code understanding is structural, not just semantic.
- **Re-ranking:** cross-encoder over candidate functions for a given question/refactor target.
- **Context Compression:** summarize large files/modules into interface-level descriptions before injecting into the reasoning prompt.
- **Query Transformation:** "self-query" — LLM converts NL request into a symbol/graph query (e.g., target function + hop depth).

## 9. LLM Design
Planning/reasoning: strong reasoning model. Code editing: code-specialized model (or same model in code mode) with tool-calling into a git-aware sandbox. Blast-radius reasoning: mostly deterministic graph traversal + LLM narration. Test-failure triage: reasoning model given traceback. Offline: Ollama `qwen2.5-coder`/`codellama` for local demo on a sample repo.

## 10. Database Design
PostgreSQL: `repos`, `code_nodes` (functions/classes), `code_edges` (calls/imports), `sessions`, `refactor_runs`, `test_results`.
Vector: pgvector `code_embeddings`.
Graph: `code_edges(from_node_id, to_node_id, edge_type)` — queried recursively (Postgres `WITH RECURSIVE`) for blast-radius.
Redis: sandbox job queue, live-run pub/sub, cache of parsed ASTs per repo commit hash.

## 11. Tech Stack
Frontend: React + code-diff viewer (Monaco editor) + graph visualization (e.g., `react-flow` or `d3`).
Backend: FastAPI + LangGraph + LangChain + `tree-sitter`/`ast` for parsing + isolated Docker sandbox with git.
DB: Postgres + pgvector, Redis.
LLM: OpenAI-compatible + Ollama (code model) fallback.
Deployment: Docker Compose with a network-isolated `sandbox` container running the test suite.
Auth: JWT + GitHub OAuth (to pull real repos and eventually open real PRs).
Monitoring/Logging: Prometheus + structured audit log of every generated diff and test run.

## 12. Folder Structure
```
cartographer/
├── backend/app/agents/{planner,retriever,reasoning,blast_radius,code_edit,test_runner,critic,memory,supervisor_graph}.py
├── backend/app/parsing/ (ast_parser.py, graph_builder.py)
├── backend/app/sandbox/ (git_worktree.py, test_executor.py)
├── backend/app/rag/{hybrid_search,graph_traversal,reranker}.py
├── backend/app/api/{repos,sessions,refactor,auth}.py
├── frontend/src/{CodeGraphView,DiffViewer,AgentTraceConsole}
├── docker-compose.yml   # includes isolated `sandbox` service
```

## 13. API Endpoints
```
POST /api/repos/ingest              (GitHub URL, clones + parses)
GET  /api/repos/{id}/graph
POST /api/chat                      (Q&A over codebase, streaming)
POST /api/refactor/plan
POST /api/refactor/execute          (streaming, sandboxed)
GET  /api/refactor/{id}/diff
POST /api/refactor/{id}/test
POST /api/feedback
```

## 14. System Design (ASCII)
```
React UI (Diff Viewer / Graph View) ⇄ Nginx ⇄ FastAPI
                                              │
                     ┌────────────────────────┼────────────────────────┐
                     │              LangGraph Agent Team                │
                     │ Planner→Retriever→Reasoning→BlastRadius→CodeEdit │
                     │              →TestRunner→Critic                  │
                     └───────┬──────────────────────────────┬──────────┘
                              │                              │
                     ┌────────▼────────┐            ┌────────▼────────┐
                     │ Postgres +      │            │ Sandbox (git +  │
                     │ pgvector +      │            │ isolated test   │
                     │ code_edges graph│            │ execution)      │
                     └─────────────────┘            └─────────────────┘
```

## 15. Sequence Diagram (text)
```
User: "Refactor payment module to use the new retry policy"
Planner → Retriever: fetch relevant functions (graph + vector)
Retriever → Reasoning Agent: propose refactor plan
Reasoning → BlastRadius Agent: list affected files/tests
BlastRadius → CodeEdit Agent: generate diff (sandbox git worktree)
CodeEdit → TestRunner: run test suite in sandbox
  if fail → Critic Agent: diagnose → CodeEdit patches (loop ≤3)
  if pass → Memory Agent stores learning → PR diff streamed to UI
```

## 16. AI Workflow — LangGraph with a `CodeEdit ⇄ TestRunner ⇄ Critic` retry cycle (mirrors Foundry's reflection pattern but grounded in real test execution, which is a stronger correctness signal than LLM self-judgment alone).

## 17. Database ER Diagram
```
repos ──< code_nodes ──< code_edges (self-referential: from_node, to_node)
repos ──< sessions ──< refactor_runs ──< test_results
code_embeddings (1:1 with code_nodes)
```

## 18. Deployment Architecture
Docker Compose: `frontend`, `backend`, `sandbox` (isolated, git+test-runtime, no external network), `postgres`, `redis`, `nginx`. The sandboxed, test-verified refactor loop is the standout production-safety story — "the agent doesn't just claim the code works, it proves it by running the real test suite."

## 19. Resume Bullets
- Built **Cartographer**, a multi-agent codebase-understanding system (LangGraph, tree-sitter, FastAPI) that constructs an AST-derived code knowledge graph and answers architectural questions via hybrid graph+vector retrieval.
- Designed an autonomous refactor pipeline that plans multi-file changes, estimates blast radius via recursive graph traversal, executes edits in an isolated sandbox, and iterates using real test-suite results as ground truth (self-healing on failure).
- Built a React diff-viewer and code-graph visualization UI with streaming agent traces, demoed end-to-end on a real open-source repository.

## 20. Interview Questions (25)
1. How do you build the call graph — static analysis or LLM-inferred? 2. Why AST-based chunking instead of naive line-based chunking? 3. How do you compute blast radius efficiently on large repos? 4. How do you know the refactor is actually correct (not just "looks right")? 5. How do you sandbox test execution safely? 6. What happens if the repo has no/poor test coverage? 7. How do you handle very large monorepos (graph size explosion)? 8. Explain your recursive graph traversal query in Postgres. 9. How do you prevent the Code-Edit Agent from breaking unrelated files? 10. How do you cap the reflection loop and what's your fallback? 11. How would you extend this to open real GitHub PRs? 12. How do you handle multiple languages in one repo? 13. What's your caching strategy for repeated queries on the same repo commit? 14. How do you evaluate retrieval quality on code specifically? 15. How would you detect architecture drift over time? 16. How do you keep the code graph in sync as the repo evolves? 17. How do you avoid leaking secrets/credentials found in the repo to the LLM? 18. Why combine graph traversal with vector search instead of either alone? 19. How do you rank candidate files for a vague refactor request? 20. How would you scale this to a CI pipeline (auto-review every PR)? 21. What's the hardest part of parsing real-world messy codebases? 22. How do you handle a refactor that legitimately requires human judgment? 23. How do you test your own agent system (meta-testing)? 24. How would you fine-tune a smaller model for this specific domain? 25. How does this compare architecturally to tools like Cursor/Sourcegraph Cody?

## 21. Future Scope
Real GitHub PR automation, CI-integrated auto-review bot, architecture-drift dashboards, multi-language support, becoming a lightweight developer-tools SaaS or open-source project with real community traction.

## 22. Difficulty: **9/10**

## 23. Timeline (8 weeks)
Wk1: repo ingestion + AST parsing + graph construction. Wk2: hybrid graph+vector retrieval. Wk3: chat Q&A over codebase (MVP). Wk4: blast-radius agent. Wk5: sandboxed code-edit + git worktree. Wk6: test-runner + reflection loop. Wk7: diff viewer + graph visualization UI. Wk8: hardening, GitHub OAuth, deploy, demo.

## 24. GitHub Portfolio Value
This is the single most **self-referential and credible** repo of the five: a tool that understands and safely refactors *its own kind* of codebase, verified by real tests — extremely compelling to any engineering interviewer, and realistically capable of attracting real GitHub stars if open-sourced well.

---
---

# FINAL RANKING & RECOMMENDATION

| Criterion | 1 VaultMind | 2 Arbiter | 3 Foundry | 4 Sentinel | 5 Cartographer |
|---|---|---|---|---|---|
| Resume Value | 8.5 | 8 | 8.5 | 8 | **9.5** |
| Interview Value | 8.5 | 8 | 8.5 | 8 | **9.5** |
| Market Demand | 8 | 7 | 8 | 7.5 | **9** |
| AI Engineering Depth | 8.5 | 8.5 | 9 | 8 | **9.5** |
| Production Readiness | 8 | 7.5 | 8 | 8 | **8.5** |
| Difficulty | 8.5 | 8 | 9 | 8 | **9** |
| Originality | 8 | **9** | 8.5 | 8 | 8.5 |
| Startup Potential | 8 | 7.5 | 7.5 | 7.5 | **9** |
| **Overall** | 8.3 | 7.9 | 8.4 | 7.9 | **9.1** |

## Overall Winner: **#5 — Cartographer**

**Why this is the single best bet for maximum recruiter impact in 2026:**
- It is the **only one of the five that is a smaller version of the exact tools hiring companies build internally** (Cursor, Sourcegraph Cody, Copilot Workspace, Devin-style agents) — every SDE interviewer immediately understands its value without translation.
- It forces you to combine skills recruiters weight most highly for SDE + AI roles simultaneously: **static analysis/AST parsing, graph algorithms, agentic planning, sandboxed execution, and test-driven verification** — this is a legitimately rare combination for a student project.
- Its correctness signal is **objective and demoable**: "the agent doesn't just say the refactor works — it runs the real test suite and proves it." That single sentence in an interview is extremely strong, because it preempts the most common (and fair) skepticism interviewers have about agentic AI projects — that they're unverified vibes.
- It is the most natural bridge into a genuine **interview deep-dive on data structures/graph algorithms** (recursive traversal, blast-radius computation) *and* modern LLM/agent design in the same conversation — maximizing discussion surface area from one project.
- Realistically buildable end-to-end on a real open-source repo in 8 weeks by one strong student, with a highly visual, screen-recordable demo (graph view → NL refactor request → live diff → tests passing).

**Second choice if you want something with a faster, punchier demo:** Foundry (self-healing data pipelines) — slightly lower ceiling on recruiter recognition than Cartographer but marginally easier to make bulletproof in 8 weeks.

**Do not build all five.** Pick Cartographer, execute the 8-week roadmap precisely, write an excellent README with a 90-second demo GIF, and use the other four ideas only as talking points ("I considered X, Y, Z but chose this because...") in interviews — that alone signals strong product judgment.
