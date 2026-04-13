# Prisma Model Layout

Use this folder to organize the Prisma schema by domain.

Current files:

- `core.prisma`: shared legacy tables and enums not yet split by domain
- `user.prisma`: user, role, permission, and auth-adjacent models
- `pipeline.prisma`: CRM pipeline models and event models

Guidelines:

- prefer one domain per file
- keep related enums next to the models that use them
- keep `prisma/schema.prisma` limited to `generator` and `datasource`
- when splitting `core.prisma`, move complete related model groups together
