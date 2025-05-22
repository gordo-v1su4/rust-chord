const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './frontend/src/main.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.[contenthash].js',
      clean: true
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 8080,
      hot: true,
      https: true, // Required for some Web Audio API features in modern browsers
      headers: {
        // Required for SharedArrayBuffer and AudioWorklet in modern browsers
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './frontend/index.html',
        filename: 'index.html',
        inject: 'body'
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'frontend/styles',
            to: 'styles'
          },
          {
            from: 'frontend/assets',
            to: 'assets'
          },
          {
            from: 'sampler-wasm/pkg',
            to: 'sampler-wasm/pkg',
            noErrorOnMissing: true // Don't error if the Wasm hasn't been built yet
          }
        ]
      })
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ]
    },
    resolve: {
      extensions: ['.js'],
      fallback: {
        fs: false,
        path: false,
        crypto: false
      }
    },
    experiments: {
      asyncWebAssembly: true // Enable Wasm support
    }
  };
};