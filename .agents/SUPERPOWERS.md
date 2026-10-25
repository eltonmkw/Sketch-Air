# Project-local Superpowers

Superpowers 6.3.0 is bundled under `skills/` for this repository. Codex discovers
repository skills in `.agents/skills/`, and the root `AGENTS.md` explicitly loads
the `using-superpowers` bootstrap at session start, including on runtimes where
skill discovery is unavailable. Start sessions in this repository or a child directory.

This is a repository-local skills installation, not an account-wide marketplace
installation. It needs no home-directory writes, setup script, network access,
or package installation on a fresh checkout. Existing sessions may need to read
the bootstrap manually; new sessions read the root instructions automatically.

## Source and maintenance

- Upstream: https://github.com/obra/superpowers
- Distribution: https://github.com/openai/plugins/tree/0722921d5542fc593105c27bd52630babd8b8c2a/plugins/superpowers
- Version and source revision: `superpowers-source.json`
- License: `SUPERPOWERS-LICENSE` (MIT)

The skill trees and supporting files are copied unchanged. Updates are deliberate:
select a reviewed distribution commit, replace the bundled skill directories,
update the source metadata and version here, and verify file equality, skill
frontmatter, and startup links. No automatic remote updates run in sessions.

Commit these files and `AGENTS.md` to the branch used by cloud sessions. Until the
installation PR is merged, start new cloud sessions from that PR branch to use it.
