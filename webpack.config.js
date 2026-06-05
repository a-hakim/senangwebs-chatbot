const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");

class MinifyCssPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("MinifyCssPlugin", (compilation) => {
      const { Compilation, sources } = compiler.webpack;

      compilation.hooks.processAssets.tap(
        {
          name: "MinifyCssPlugin",
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        },
        () => {
          Object.keys(compilation.assets)
            .filter((filename) => filename.endsWith(".css"))
            .forEach((filename) => {
              const source = compilation.assets[filename].source().toString();
              const minified = source
                .replace(/\/\*[\s\S]*?\*\//g, "")
                .replace(/\s+/g, " ")
                .replace(/\s*([{}:;,>])\s*/g, "$1")
                .replace(/;}/g, "}")
                .trim();

              compilation.updateAsset(
                filename,
                new sources.RawSource(minified)
              );
            });
        }
      );
    });
  }
}

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
      clean: !minified,
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
          ]
        : [],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: `swc${suffix}.css`,
      }),
      ...(minified ? [new MinifyCssPlugin()] : []),
    ],
  };
}

module.exports = [
  createConfig({ minified: false }),
  createConfig({ minified: true }),
];
