# Branches and authorship

Owner of: which branch receives a fix or feature, wrong-base PRs, and how
contributor authorship is preserved. Applies to every mutating action.

## Finding mainline

"Mainline" is whichever branch the release process reads from. Before
creating a branch or merging, decide it in this order:

1. **Written policy wins:** CONTRIBUTING, README, or the canonical agent
   file on the trusted base.
2. **Otherwise detect:** `gh repo view --json defaultBranchRef` for the
   default branch; `git branch -r` for long-lived branches (`develop`,
   `next`, `release/*`, version lines).
3. **Nothing stated or detected:** assume one `main`/`master` that receives
   both fixes and features.
4. **Split layout:** fixes go to the default branch; additive features go to
   the feature-integration branch. Use the same fix / additive / breaking
   classification as the changelog
   (`references/changelog-and-versioning.md`).

A PR that targets the wrong base branch is a finding. Retarget it before merging with
`gh pr edit <N> --base <branch>` (a confirm-first action) and record it in
the report.

## Authorship

- Contributor commits keep their authors.
- Maintainer fixes go on top as separate commits on the contributor's branch
  when the fork allows maintainer edits, with conventional messages such as
  `fix(<scope>): …` or `chore(<scope>): …`.
- Contributor commits are not squashed, rebased, amended, or force-pushed
  unless the user explicitly asks for it and the project allows it.
- Published history and tags stay intact.

## No "fix it later"

If the PR needs a correction to be mergeable, the correction goes into that
PR. Do not merge a known defect on the promise of a follow-up.
