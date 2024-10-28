const packageJson = require('./package.json')

module.exports = {
  apps: [
    {
      name: packageJson.name,
      script: "npm",
      args: "start",
      instances: 1,
      max_memory_restart: '256M',
      max_restarts: 3,
      env: {
        NODE_ENV: 'production',
        NODE_CONFIG_ENV: 'mainnet',
        NODE_CONFIG_DIR: './config',
      }
    }
  ]
}
