const serverlessWebpack = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'development',
  entry: serverlessWebpack.lib.entries,
  target: 'node',
  externals: [nodeExternals()]
};
