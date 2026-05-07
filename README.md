# React Legacy Learning Lab

Interactive educational React MVP for learning legacy SPA runtime flow.

This repository is intended to grow into a general-purpose learning framework for understanding how code executes, how data changes, and why state transitions happen.

## What This Project Is

This project is an executable learning playground.

Its main purpose is not to deliver a production-ready business feature set, but to help learners observe and experiment with runtime behavior such as:

- user input to payload conversion
- API request and response flow
- reducer and state transitions
- rerender timing and visible UI changes
- failure branches and fallback behavior

The core value of the project is explainability through execution.

Instead of only reading code or only seeing final output, a learner should be able to:

1. change an input
2. run a scenario
3. inspect the timeline
4. compare state changes
5. understand why the result happened

## What This Project Is Not

This project is not a production starter kit.

It should not be judged only by typical product standards such as:

- minimal instrumentation in feature code
- pure business feature density
- production authentication completeness
- shortest implementation path

Some parts of the codebase intentionally include educational instrumentation such as trace sessions, checkpoints, meaning panels, state diffs, and flow viewers. Those choices exist to improve learning clarity, even when they are more explicit than a typical production implementation.

## Why It Matters

Most example projects show either:

- only the final UI result
- only isolated code snippets
- or only technical logs

This project aims to connect all three:

- the learner action
- the execution path
- the business meaning

That makes it useful for:

- self-study
- onboarding junior developers
- teaching legacy SPA patterns
- explaining reducer and context flow
- comparing success, error, and fallback paths

## Framework Vision

The longer-term goal is to make this repository a reusable learning framework, not just a single React demo.

The framework pattern is:

1. define an experiment
2. let the learner change inputs
3. run the flow as a session
4. capture checkpoints
5. explain data changes and state changes
6. connect each step back to source code and intent

That pattern should be portable beyond React.

Possible future applications:

- Java/Spring request lifecycle learning
- Node/Nest service and controller flow learning
- Python/FastAPI request and persistence flow learning
- SQL execution and result transformation learning
- state management training in other frontend frameworks
- event-driven system flow visualization

In other words, the long-term asset is not only the React example itself, but the teaching structure behind it.

## Design Principles

When extending this project, prefer these principles:

- `traceability`: a learner should see where the flow came from and where it went
- `explainability`: each important step should answer "what happened" and "why"
- `controlled experimentation`: inputs and mock conditions should be easy to change
- `visible state change`: before and after comparisons should be easy to inspect
- `business meaning first`: technical events should be connected to business intent
- `repeatable sessions`: one click or action should be teachable as one experiment session

## Extension Rules

When adding new chapters or examples, optimize for learning clarity before feature volume.

Good additions usually include:

- a clear scenario title
- editable input or mock conditions
- a visible execution timeline
- meaningful checkpoints
- state diff or data diff output
- short explanation of why the flow matters

Avoid turning the repository into a generic CRUD sample with observability bolted on afterward. The observability and explanation layer is part of the product purpose here.

## Direction

- [Task 5. Observable Flow Playground 방향 리팩토링 요청서](docs/task-5-observable-flow-playground.md)
- [Learning Index](docs/learning-index.md)

## Run

```bash
npm install
npm run dev
```

## Local Scripts

Windows:

- `scripts/win/0-run-local.bat`
- `scripts/win/1-kill-local.bat`

macOS:

- `scripts/mac/0-run-local.command`
- `scripts/mac/1-kill-local.command`

## Mock Query String

API responses are controlled from the browser URL:

```text
?mock=auth:200:session-restored,login:200:login-done,users:404:list-failed,write:200:create-done,delete:500:delete-failed
```

Format:

```text
apiKey:status:message
```

Supported API keys:

- `auth`
- `login`
- `users`
- `write`
- `delete`
