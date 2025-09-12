const path = require("path");

const fnConfig = {
  devtool: false, 
  name: "client",
  target: "web",
  resolve: {
    extensions: ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.json'], 
  },
  entry: {
    functions: "./src/client/entry.ts",
  },
  output: {
    filename: "celari.client.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
          target: 'es2020',
        },
        exclude: /node_modules/,
      },
    ],
  },


};

const swConfig = {
  devtool: false, 
  resolve: {
    extensions: ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.json'], 
  },
  name: "sw",
  target: "webworker",
  entry: {
    sw: "./src/serviceWorker/entry.ts",
  },
  output: {
    filename: "sw.bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
          target: 'es2020',
        },
        exclude: /node_modules/,
      },
    ],
  },


};

module.exports = [fnConfig, swConfig];