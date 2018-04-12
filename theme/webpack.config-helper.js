'use strict'

const Path = require('path')
const Webpack = require('webpack')
const BundleTracker = require('webpack-bundle-tracker')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const ExtractSASS = new ExtractTextPlugin('../css/bundle-[hash].css')

module.exports = (options) => {

  const webpackConfig = {
    devtool: options.devtool,
    entry: {
      main: [
       `webpack-dev-server/client?http://localhost:${options.port}`,
       'webpack/hot/dev-server',
       './src/scripts/index',
       ],
      chart: './src/scripts/charts'
    },
    output: {
      publicPath: 'http://127.0.0.1:1339/',
      path: Path.join(__dirname, 'static', 'js'),
      filename: 'bundle-[name]-[hash].min.js'
    },
    plugins: [
      new Webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(options.isProduction ? 'production' : 'development')
        }
      }),
      new BundleTracker({filename: './webpack-stats.json'})
    ],
    module: {
      loaders: [{
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.(png|jpg|gif|svg)/,
        loader: 'url-loader',
        options: {
          limit: 8192
        }
      },
      {
        test: /\.(woff|woff2|ttf|eot)/,
        loader: 'file-loader',
      },
      ]
    }
  }

  if (options.isProduction) {
    webpackConfig.entry =  {
      main: './src/scripts/index',
      chart: './src/scripts/charts'
    },

    webpackConfig.plugins.push(
      new Webpack.optimize.OccurenceOrderPlugin(),
      new Webpack.optimize.UglifyJsPlugin({
        compressor: {
          warnings: false
        }
      }),
      ExtractSASS
    )

    webpackConfig.module.loaders.push({
      test: /\.s[a|c]ss$/i,
      loader: ExtractSASS.extract(['css', 'sass'])
    })

  } else {
    webpackConfig.plugins.push(
      new Webpack.HotModuleReplacementPlugin()
    )

    webpackConfig.module.loaders.push({
      test: /\.s[a|c]ss$/i,
      loaders: ['style', 'css', 'sass']
    }, {
      test: /\.js$/,
      loader: 'eslint?{rules:{semi:0}}',
      exclude: /node_modules/
    })

    webpackConfig.devServer = {
      hot: true,
      port: options.port,
      inline: true,
      progress: true,
      headers: { 'Access-Control-Allow-Origin': 'http://localhost:8000' } // django runserver
    }

  }

  return webpackConfig

}