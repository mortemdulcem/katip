#!/bin/bash
set -e

# Install JS dependencies for the merged code. Idempotent and safe to re-run.
npm install

# NOTE: `npm run db:push` (drizzle-kit) is intentionally NOT run automatically here.
# The dev database is already provisioned and carries pre-existing drift that an
# UNATTENDED push cannot resolve safely (stdin is closed during post-merge, so any
# prompt aborts the whole setup):
#   - raw-SQL pgvector tables corpus_books / corpus_chunks (~24k rows + embeddings)
#     are not modelled in shared/schema.ts; they are excluded via drizzle
#     `tablesFilter` so a manual push will not offer to drop them, but they must
#     never be managed by an unattended push.
#   - several foreign keys / unique constraints (e.g. the signature_* tables) were
#     created outside Drizzle's naming convention, so push wants to drop & recreate
#     them. That fails on dependency ordering and triggers data-loss prompts.
# Merged tasks in this project are analysis scripts that do not change the Drizzle
# schema, so no migration is needed after a merge. If a future change DOES alter the
# schema, run `npm run db:push` manually so the interactive data-loss prompts can be
# reviewed by a human.
