module.exports = {
    apps: [{
        name: 'ca-backend',
        script: 'src/server.js',
        instances: 'max',  // Use all available CPU cores
        exec_mode: 'cluster',
        watch: false,
        max_memory_restart: '500M',
        env: {
            NODE_ENV: 'production',
            PORT: 5000
        },
        env_production: {
            NODE_ENV: 'production'
        },
        error_file: '/var/log/pm2/ca-backend-error.log',
        out_file: '/var/log/pm2/ca-backend-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        autorestart: true,
        max_restarts: 10,
        min_uptime: '10s',
        listen_timeout: 3000,
        kill_timeout: 5000,
        wait_ready: true,

        // Cron restart at 3 AM daily (optional)
        cron_restart: '0 3 * * *',

        // Load balancing
        instance_var: 'INSTANCE_ID'
    }]
};
