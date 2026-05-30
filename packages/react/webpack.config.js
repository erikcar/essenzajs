const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: 'development', //production, development
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'index.js',
    library: 'esreact',
    libraryTarget: 'umd', //'var' , 'umd'
    clean: true
    //globalObject: 'this',
  },
  optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        extractComments: false,
        //sourceMap: true, // Must be set to true if using source-maps in production
        terserOptions: {
          compress: {
            drop_console: false,
          },
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
  module: {
    rules: [{
      test: /\.js$/,
      //\.jsx?$/,
      exclude: /(node_modules)/,
      use: 'babel-loader',
    }],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    symlinks: false, // importante per hot reload con pnpm link
    alias: {
      '@essenza/core': path.resolve(__dirname, '../core/src')
    }
  },
  watchOptions: {
    ignored: /node_modules/
  },
  externals: {
    antd: 'antd',
    'react-router-dom': 'react-router-dom',
    react: 'react',
    //'@essenza/core': '@essenza/core',
    'react-to-print': 'react-to-print',
  },
};
