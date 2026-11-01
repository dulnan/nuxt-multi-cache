---
title: Agent Skills
editLink: true
---

# Agent Skills

The package ships two [agent skills](https://agentskills.io) for coding agents
such as Claude Code, Cursor or Codex. They tell the agent how to use the module
and what to check, and link to this documentation for details.

| Skill                         | Use                                                                                                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nuxt-multi-cache`            | Adding, reviewing and debugging caching: which cache fits which job, the rules that keep one visitor's content from being served to another, purging, and how to check the cache. |
| `nuxt-multi-cache-upgrade-v5` | Upgrading from 4.x: checks every breaking and behavior change against your project and reports each one with evidence.                                                            |

The skills are in `node_modules/nuxt-multi-cache/skills/` and are versioned with
the package.

## Installation

Agents don't read skills from `node_modules` themselves. One of these tools
links them into the skill folders of your agents.

### pnpm

pnpm links the skills of approved dependencies (since pnpm 12.11). After
installing the module, approve its skills:

```sh
pnpm approve
```

The approval is stored in `pnpm-workspace.yaml`, and the skills are linked into
the existing agent folders such as `.claude/skills/`, named
`pnpm-nuxt-multi-cache-<skill>`. In Claude Code, the commands keep the names of
the skills, e.g. `/nuxt-multi-cache`. See
[pnpm: Agent Skills](https://pnpm.io/agent-skills).

### npm, yarn and bun

[skills-npm](https://github.com/antfu/skills-npm) links the skills of your
dependencies on every install:

```sh
npm install -D skills-npm
npx skills-npm setup
```

`setup` adds a `prepare` script and links the skills right away.

### Skills CLI

The [skills CLI](https://github.com/vercel-labs/skills) installs the skills from
the GitHub repository:

```sh
npx skills add dulnan/nuxt-multi-cache
```

These copies follow the repository, not the version you installed, so run
`npx skills update` after updating the module.

### Manually

Copy or symlink the folders in `node_modules/nuxt-multi-cache/skills/` into the
skill folder of your agent, e.g. `.claude/skills/` for Claude Code or
`.agents/skills/`.

## Usage

The agent loads a skill by itself when a task matches its description. You can
also name the skill in your prompt, or run it as a command in Claude Code.

### Upgrading from 4.x

Update the module to 5.x, link the skills, then ask the agent:

```text
Upgrade nuxt-multi-cache to 5.0 and check every breaking change against this
project. Report each one as affected or not affected.
```

The agent fixes what is mechanical and lists everything else for you to decide,
including what it can't check in the repository, such as environment variables
of the deployment.

With the skills CLI, you can also add the upgrade skill before updating:

```sh
npx skills add dulnan/nuxt-multi-cache --skill nuxt-multi-cache-upgrade-v5
```

### Caching

Examples for the `nuxt-multi-cache` skill:

```text
Cache the product pages for an hour, but never for logged in users.
```

```text
Why isn't the homepage served from the route cache?
```

```text
Review our caching for anything that could serve one visitor's content to
another.
```
