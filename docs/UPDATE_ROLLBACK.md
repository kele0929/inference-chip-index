# Update and rollback

Automated pull requests and auto-publication are out of scope. Reviewers promote by hand.

## Fixture mode

Parses `data/fixtures/pack` and must reproduce both `data/fixtures/expected-output.sha256` and `data/fixtures/output/snapshot.sha256`. Those files are committed (not gitignored) so `bun run pipeline:check` works on a clean checkout.

```bash
bun run pipeline:fixture
bun run pipeline:check
```

## Full-source mode

Parses every allowlisted file under `data/source` at pinned commit `4d3916ac9cf474b679cdfcf492d43a0559418ad1`.

```bash
# optional: copy the live generated tree aside before replacing it
mkdir -p data/generated/v1.previous
cp data/generated/v1/* data/generated/v1.previous/
bun run dataset:update
```

Promotion writes `data/generated/v1/` only after Zod validation, duplicate-ID checks, provenance checks, unit checks, and incompatible-merge checks pass.

## Rollback

```bash
bun run dataset:rollback
# or
bun run scripts/rollback.ts v1
```

This copies `data/generated/v1.previous/` over `data/generated/v1/`. Keep the previous tree from the copy step above.

## CI failure modes

`bun run pipeline:check` fails on hash mismatch (nondeterminism or uncommitted generated changes). The validator fails on missing provenance, unknown units, invalid numbers, duplicate IDs, or incompatible slice merges.
