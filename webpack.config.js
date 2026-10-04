const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

function createConfig({ minified }) {
  const suffix = minified ? ".min" : "";

  return {
    name: minified ? "minified" : "readable",
    mode: "production",
    devtool: false,
    entry: {
      swc: "./src/js/swc.js",
    },
    output: {
      filename: `swc${suffix}.js`,
      path: path.resolve(__dirname, "dist"),
      clean: false, // Both compilers share dist; neither may delete the other compiler's assets.
      library: {
        name: "SWC",
        type: "umd",
      },
      globalObject: "this",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
      ],
    },
    optimization: {
      minimize: minified,
      minimizer: minified
        ? [
            new TerserPlugin({
              extractComments: false,
            }),
            new CssMinimizerPlugin(),
          ]
        : [],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: `swc${suffix}.css`,
      }),
    ],
  };
}

module.exports = [
  createConfig({ minified: false }),
  createConfig({ minified: true }),
];
