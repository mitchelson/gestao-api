/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: 'gestao-api',
      script: 'dist/main.js',
      cwd: '/opt/gestao-api',
      instances: 1,
      exec_mode: 'fork',
      // Secrets vêm de .env.production (post-deploy + loadEnvFiles no boot).
      // Não espelhar GOOGLE_* aqui — valores vazios no PM2 bloqueiam o dotenv.
      env_production: {
        NODE_ENV: 'production',
        PORT: 3060,
        HOST: '127.0.0.1',
        TRUST_PROXY: 'true',
      },
    },
  ],
};
