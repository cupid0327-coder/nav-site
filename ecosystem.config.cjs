module.exports = {
  apps: [
    {
      name: 'n_site',
      script: '.next/standalone/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
      },
      env_file: '.env',
      max_memory_restart: '512M',
    },
  ],
};
