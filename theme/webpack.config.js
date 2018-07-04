const path = require("path");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const BundleTracker = require("webpack-bundle-tracker");
const webpack = require("webpack");

const devMode = process.env.NODE_ENV !== "production";

module.exports = {
  mode: process.env.NODE_ENV,
  context: path.resolve(__dirname),
  devtool: devMode ? "eval-source-map" : false,
  entry: {
    main: "./src/scripts/index",
    style: "./src/styles/main.sass",
    formResponseDetails: "./src/scripts/form-response-details",
    formResponseList: "./src/scripts/form-response-list",
    investigationUsers: "./src/scripts/investigation-users",
  },
  output: {
    publicPath: devMode ? "http://127.0.0.1:1339/" : "/static/js/",
    path: path.join(__dirname, "static", "js"),
    filename: "bundle-[name]-[hash].min.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.s[a|c]ss$/i,
        use: [
          devMode ? "style-loader" : MiniCssExtractPlugin.loader,
          "css-loader",
          "postcss-loader",
          "sass-loader"
        ]
      },
      {
        test: /\.(png|jpg|gif|svg)/,
        use: {
          loader: "url-loader",
          options: {
            limit: 8192
          }
        }
      },
      {
        test: /\.(woff|woff2|ttf|eot)/,
        use: {
          loader: "file-loader"
        }
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "../css/bundle-[hash].css"
    }),
    new BundleTracker({
      filename: "./webpack-stats.json"
    }),
    new webpack.HotModuleReplacementPlugin()
  ],
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  devServer: devMode
    ? {
        hot: true,
        port: 1339,
        inline: true,
        progress: true,
        headers: { "Access-Control-Allow-Origin": "http://localhost:8000" } // django runserver
      }
    : {}
};
