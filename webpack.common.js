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
    splitChunks: {
      chunks: 'all',
    },
  },
}
