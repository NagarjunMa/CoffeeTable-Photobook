# Hampi Feature Engineering Review

Date: September 17, 2026. Mode: review only, followed by local feature-branch
creation. Baseline: `191db1f`. This is evidence-based review, not certification
of compliance or an unconditional production-readiness claim.

## Contract And Scope

Review the pending Hampi import, scoped Drive sync, map assets, approved story,
optional `indexNote`, affected consumers, tests and documentation. Preserve all
four earlier books, private delivery settings, source image quality, responsive
maps, gallery framing and editorial approval gates. Exclude unrelated `.agents/`
and `marketing/` work. No new Drive/Cloudflare calls, upload, remote deletion,
deployment, remote push or application-code changes during this review.

Risk: **critical**, because scoped sync updates an image manifest associated with
private external storage. Independent read-only review supplemented the main
review. Current-account import success is not proof of account-migration safety.

## Findings

### P2: Scoped Account Changes Can Break Retained Books - Open, Introduced

`scripts/sync-drive.ts:637` retains unselected image IDs, but only selected books
receive delivery verification at lines 631-635. The publisher resets its cache
when the account changes (`scripts/lib/cloudflare-images.ts:90`), while the site
has one global delivery account. A new-account scoped upload can therefore pass
and publish a manifest whose retained books still belong to the previous account.

Resolution: bind the published manifest to its Cloudflare account and reject
scoped account changes before uploads. Require an explicit full-library migration
for account changes; test missing/stale account metadata and failed migrations.
Do not infer account ownership solely from a cache that may have been removed.
Owner: engineering. Gate: resolve before approving general scoped-publisher use
across account configurations. No current Hampi delivery failure was observed in
the previously authorized import; this review did not call the live provider.

### P2: Drive Map Failures Can Drop Existing References - Open, Preexisting

The catches at `scripts/sync-drive.ts:519`, `536` and `553` warn without adding
map failures to the publication-failure gate. A replacement collection may thus
omit previously working Drive-map references after a failed conversion/download.

Resolution: fail the publication or deliberately retain prior map references;
add failure-injection tests for all three map variants. Owner: engineering.
Hampi's local map masters avoid this path. This is not caused by the new maps.

### Coverage Gap: Sync Orchestration Failure Injection

Scope tests exercise pure selection/merge helpers; publisher tests mock provider
behavior. They do not run the complete sync orchestration with injected Drive and
Cloudflare failures. Add integration coverage proving that unselected books are
never downloaded/uploaded and that upload, verification and manifest-write
failures preserve the prior manifest. Include the account-change scenario above.

## Design And Compatibility

- Pure scope helpers match the repository's existing separation of data rules
  from external I/O. Existing full-library CLI behavior remains the default.
- The optional `indexNote` is additive, approval-gated and falls back to `note`.
  Full narrative stays in the gallery. No route or signing API changed.
- Existing four collection objects and map manifest entries deep-compare equal
  to baseline. Both Hampi master hashes match their generated manifest.
- No new dependencies, permission changes, photo quality settings or remote
  cleanup. Maps are public artwork; photographs continue using signing routes.
- Duplicate route validation exists before uploads and before publication. This
  is defensive validation rather than a reason for a broad refactor in this pass.
- Schema migrations, database transactions and extension permissions are N/A.
  Account provenance is a real external-state gap, documented above.

## Evidence

- Passed: 35 unit/contract tests across sync, publisher/delivery, editorial, maps
  and gallery rendering.
- Passed: fresh isolated production build (9 pages), TypeScript no-emit, ESLint,
  and Git whitespace checks.
- Passed: preservation comparison of prior books/maps, Hampi master hashes,
  12-photo Hampi inventory and all 64 photograph paths using delivery endpoints.
- Passed: all 129 browser tests across Chrome, Firefox and WebKit (3.8 minutes),
  using deterministic image fixtures rather than live providers. Includes
  automated accessibility, responsive layout, history and lightbox regressions.
- Inspected the 320px Hampi map/story and 768px collection-opening screenshots;
  copy and preview geometry fit. Fixture images do not establish photo fidelity.
- Historical evidence: the earlier authorized import verified live signed and
  denied delivery. Those results were not rerun against production in this review.

Not claimed: physical-device testing, screen-reader testing, full-resolution
source/CDN fidelity comparison, new dependency-vulnerability audit, performance
scores or formal accessibility/security compliance. Filename-style descriptions
for Hampi still require editorial approval; image records were not bulk-approved.

## Disposition

Suitable to preserve on a local feature branch for review, not an unconditional
merge sign-off. The account-change defect and orchestration coverage should be
resolved before broader publisher use. Local import rollback remains documented
in `HAMPI_IMPORT.md`; rollback must not delete private remote photographs.
