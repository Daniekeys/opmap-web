# api-types

Typed copies of the Zod schemas in `opmap-api`. The API repo owns the data contracts; this folder only mirrors the ones the web app uses.

Rules:
- Every file starts with a comment naming the `opmap-api` file it mirrors, in the form `// Mirrors opmap-api/<path to the schema file>`.
- Update the copy here whenever the API schema changes. Change the API first, then this folder.
- Copy only what the web app uses. Do not add types that have no schema in the API.
