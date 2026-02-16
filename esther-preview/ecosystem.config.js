/** PM2 ecosystem config for Esther Preview dashboard. */
module.exports = {
  apps: [
    {
      name: "esther-preview",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/opt/esther-preview",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/esther-preview/error.log",
      out_file: "/var/log/esther-preview/out.log",
    },
  ],
};
