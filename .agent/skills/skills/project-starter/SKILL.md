---
name: project-starter
description: Automates the setup of a new 'Vibe Coding' project by copying the core Skill Center infrastructure (Memory Bank, CLAUDE.md, etc.).
---

# Project Starter Skill

## Overview
This skill is designed to turn any "clean" folder into a professional AI-ready workspace.

## Instructions
When the user asks to "start a new project" or "initialize this folder":

1. **Setup Infrastructure**:
   - Create a `.agent/skills/skills/` directory.
   - Create a `memory-bank/` directory.
   - Create initial `memory-bank/activeContext.md`, `projectBrief.md`, and `progress.md` files.

2. **Copy Constitution**:
   - Ask the user for the project vision.
   - Generate a custom `CLAUDE.md` based on that vision.

3. **Install Core Skills**:
   - Suggest installing `systematic-debugging`, `writing-plans`, and `brainstorming`.

4. **Final Onboarding**:
   - Create a link to the central `LEARNING_CENTER.md` as a reference.

## Rationale
Ensures consistency across all of the user's projects without manual copy-pasting.
