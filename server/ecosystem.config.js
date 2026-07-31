module.exports = {
  apps: [
    {
      name: "bolimph-backend",
      script: "./dist/server.js", // Entry point (use ./dist/server.js for TS)
      instances: "max", // Use "max" for cluster mode, or 1 for single instance
      exec_mode: "cluster", // Load balances across CPU cores ("fork" for single)
      watch: false, // Set true in dev to restart on file changes
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Logging configuration
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
