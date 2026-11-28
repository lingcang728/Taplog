# Rules for AI coding agents

This repository holds the **Taplog v0.7.0 demo** (`src/`, `public/`, `test/`) and the Group 17 course project documents (`docs/project/`).

## Do not reuse Taplog code without asking

- The Taplog demo is an early exploration. The new prototype is **not** built on top of it.
- Do **not** import, copy or adapt any Taplog component, module, style or data (for example the player, subtitles, timeline, cards or the built-in M1/M2 talks) on your own.
- If you think a piece of Taplog code, or any other existing code, would help, **stop and ask the team first**. Name the file and explain why. Use it only after a team member says yes.
- The built-in M1/M2 talks are fabricated, and their audio is synthesized. Never use them as research data.

## Secrets

- API keys (Aliyun speech recognition, DeepSeek) go only in a local `.env`, which is git-ignored. This repository is **public**: never commit keys, and keep `.env.example` to variable names only.

## Project documents

- The plan is `docs/project/项目总计划.md` and the task list is `docs/project/任务表.md`. Follow them for scope: interactive diagram notes, audio replay, marks for points covered again later, and live Q&A while recording.
- The UI, notes and report are in English.
