const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    popup: path.resolve('src/popup/index.tsx'),
    background: path.resolve('src/background/index.ts'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg|webp)$/,
        type: 'asset/resource'
      },
      {
        test: /package\.json$/,
        type: 'json'
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "path": false,
      "fs": false
    }
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('public'),
          to: path.resolve('dist'),
          globOptions: {
            ignore: ['**/index.html'], // Loại bỏ index.html từ việc copy
          },
        }
      ],
    }),
    new HtmlPlugin({
      title: 'So Sánh Hóa Đơn Excel',
      filename: 'popup.html',
      chunks: ['popup'],
      template: 'src/popup/index.html',
    }),
    new HtmlPlugin({
      title: 'So Sánh Hóa Đơn Excel - Phiên bản đầy đủ',
      filename: 'index.html',
      chunks: ['popup'],
      template: 'public/index.html',
    }),
  ],
  output: {
    filename: '[name].js',
    path: path.resolve('dist'),
  },
  optimization: {
    // Disable code splitting/chunking for easier debugging
    splitChunks: {
      // Set to false to completely disable code splitting
      chunks: 'async', // Only split async chunks (effectively keeping main bundles whole)
      // You can set to 'all' to enable splitting, or 'false' to disable entirely
      // Setting cacheGroups to empty prevents any splitting from webpack defaults
      cacheGroups: { default: false }
    },
    // Keep one runtime chunk instead of one per entry point
    runtimeChunk: false,
    // Minimize for production but keep readable for debugging
    minimize: false
  },
}
