import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationName = process.argv[2];
if (!migrationName) {
  console.error('Provide migration name!');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, 'src/databases/postgre/migrations');

execSync(`npx node-pg-migrate create ${migrationName} -m ${migrationsDir}`, { stdio: 'inherit' });
