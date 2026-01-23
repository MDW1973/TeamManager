const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const mainConfig = {
  mode: 'development',
  entry: './src/main.ts',
  target: 'electron-main',
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: /src/,
        use: [{ loader: 'ts-loader', options: { configFile: 'tsconfig.build.json' } }]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  externals: {
    electron: 'commonjs2 electron'
  }
};

const preloadConfig = {
  mode: 'development',
  entry: './src/preload.ts',
  target: 'electron-preload',
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: /src/,
        use: [{ loader: 'ts-loader', options: { configFile: 'tsconfig.build.json' } }]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'preload.js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  externals: {
    electron: 'commonjs2 electron'
  }
};

const rendererConfig = {
  mode: 'development',
  entry: './src/renderer/index.tsx',
  target: 'electron-renderer',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: /src/,
        use: [{ loader: 'ts-loader', options: { configFile: 'tsconfig.build.json' } }]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'renderer.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html'
    })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
};

module.exports = [mainConfig, preloadConfig, rendererConfig];
