# TrustOps - Project Context

## Overview

TrustOps is a Lifecycle-Oriented Trust Management Framework for AI-Assisted Software Repair.

The goal of TrustOps is not to generate software patches, but to evaluate, explain, validate, learn from, and continuously adapt the trustworthiness of AI-generated software patches throughout their lifecycle.

TrustOps extends our previous research prototype called TrustPatch.

TrustPatch focused on trust-aware patch ranking.

TrustOps extends this into a complete trust lifecycle consisting of:

1. Patch Generation
2. Validation
3. Trust Computation
4. Trust-Based Patch Selection
5. Trust Explanation
6. Human-in-the-Loop Validation
7. Trust Knowledge Base
8. Runtime Monitoring
9. Continuous Trust Adaptation

The system is built using:

Frontend:
- React
- TypeScript
- TailwindCSS

Backend:
- FastAPI
- Python

Deployment:
- Docker
- Docker Compose
- Render
- Vercel

Current prototype already supports:

- Patch generation
- Test execution
- Trust computation
- Patch ranking

The next objective is to extend it into a lifecycle-oriented framework suitable for publication at ISEC 2027.

Do not redesign the existing architecture unnecessarily.

Always preserve modularity and extensibility.