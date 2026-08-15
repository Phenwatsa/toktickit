# Lab 1 — AI Use and Reflection

**LLM/agent used:** Antigravity AI Coding Agent (Gemini 3.6 Flash)

## Selected key prompts (6–10)

| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Read the Lab 1 instructions, understand the full-stack architecture, and explain the project overview back to me. | Used the summary to map out the 4 GitHub Issues and setup the development roadmap. |
| 2 | Teach me Git Flow discipline and give me the exact terminal commands to branch, commit, push, and create PRs. | Learned and ran `git checkout -b`, `git add`, `git commit`, and `git push` for each feature branch. |
| 3 | Explain the requirements for each Issue before coding and list all files that need to be created or modified. | Identified affected files in `client/` and `server/` before implementing each step. |
| 4 | Write the code file-by-file while explaining the logic and reasons for each step so I can learn along the way. | Developed Express endpoints, Prisma schemas/seeds, React components, and test files step-by-step. |
| 5 | Check the provided Acceptance Criteria line-by-line to verify if the implementation meets all requirements. | Tested HTTP status codes, JSON responses, dynamic React rendering, and Online/Offline error handling. |
| 6 | Review the peer feedback I received from my partner, identify missing items, and update code and tests accordingly. | Added explicit Supertest assertions and a Vitest loading state test to satisfy reviewer requests. |
| 7 | Audit and clean up the codebase style, keeping comments neat and ensuring standard TypeScript formatting. | Formatted code with clean `//` section headers, explicit TypeScript types, and 2-space indentation. |
| 8 | Perform a final audit of all code, tests, and docs to ensure full project completion before merging to main. | Confirmed 100% test pass rate across client and server, verified documentation, and prepared the release PR. |

## Reflection

Working with the Antigravity AI coding agent provided an interactive and structured learning experience throughout Lab 1. Asking the agent to explain the architecture first, list required files, and write code file-by-file with clear explanations helped me understand every part of the stack—from Express REST APIs to React state management. Using targeted prompts to check acceptance criteria and address peer review feedback ensured the final application was well-tested, clean, and fully met the lab requirements.
