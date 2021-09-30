module.exports = {
  apps: [
    {
      name: 'squoosh',
      script: './node_modules/serve/bin/serve.js',
      args: '--listen=5101 --config ../../../serve.json ./build',
      instances: 2,
      exec_mode: 'cluster',
      // env: {
      //   NODE_ENV: 'development',

      // },
      env_production: {
        NODE_ENV: 'production',
      },
    },
    // optionally a second project
  ],
};
