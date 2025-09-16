module.exports = {
    apps: [{
        name: 'yellow-pages-api',
        script: 'server.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 5000
        }
    }]
};