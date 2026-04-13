const lines = [
  'Blocked: `prisma db push` is forbidden in this repository.',
  '',
  'Reason:',
  '  this project uses schema files plus committed SQL migrations as the schema authority.',
  '  db push bypasses migration history and breaks parity between local, staging, and production.',
  '',
  'Use this flow instead:',
  '  1. Edit prisma/models/*.prisma',
  '  2. pnpm prisma:migrate:dev --name your_change_name',
  '  3. Commit schema + migration SQL',
  '  4. pnpm prisma:migrate:deploy',
];

console.error(lines.join('\n'));
process.exit(1);
