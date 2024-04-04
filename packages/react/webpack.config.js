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
    minimize: true,
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
      test: /\.jsx?$/,
      exclude: /(node_modules)/,
      use: 'babel-loader',
    }],
  },
  externals: {
     antd: 'antd',
     'react-router-dom': 'react-router-dom',
     react: 'react',
     //'@essenza/core': '@essenza/core',
     'react-to-print': 'react-to-print'
   },
};