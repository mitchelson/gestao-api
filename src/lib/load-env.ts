import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Carrega .env sobrescrevendo chaves vazias do PM2.
 * PM2 `env_production` + `--update-env` pode deixar GOOGLE_*="" no process.env;
 * o dotenv padrão do Nest não sobrescreve chaves já definidas (mesmo vazias).
 */
export function loadEnvFiles(cwd = process.cwd()) {
  for (const file of ['.env.production', '.env']) {
    applyEnvFile(resolve(cwd, file));
  }
}

function applyEnvFile(path: string) {
  if (!existsSync(path)) return;

  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;

    const eq = line.indexOf('=');
    const key = line.slice(0, eq).trim();
    if (!key) continue;

    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    const current = process.env[key];
    if (current === undefined || current === '') {
      process.env[key] = value;
    }
  }
}
