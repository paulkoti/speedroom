module.exports = {
  apps: [{
    name: 'speedroom-backend',
    script: './backend/server.js',
    cwd: '/var/www/speedroom',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    }
  }]
};