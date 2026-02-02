# Gatekeeper Docs

Docs are generated with sphinx, furo, using the MyST Parser. Dependencies are defined in the `docs` dependency group.

To run a hot reload server for development, clone the repo, and in the root, run:

```bash
uv sync --only-group docs
uv run sphinx-autobuild docs/source docs/build
```

The docs will be available at http://127.0.0.1:8000/, and the build will be in `docs/build`.

Docs is not a default group.
