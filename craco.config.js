const webpack = require("webpack");
const path = require("path");

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // Fix ESM-only packages (openapi-fetch, @metamask/sdk, etc.)
            webpackConfig.module.rules.push({
                test: /\.m?js/,
                resolve: { fullySpecified: false },
            });

            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                crypto: require.resolve("crypto-browserify"),
                stream: require.resolve("stream-browserify"),
                assert: require.resolve("assert"),
                http: require.resolve("stream-http"),
                https: require.resolve("https-browserify"),
                os: require.resolve("os-browserify/browser"),
                url: require.resolve("url"),
                buffer: require.resolve("buffer"),
                process: require.resolve("process/browser.js"),
            };

            webpackConfig.resolve.alias = {
                ...webpackConfig.resolve.alias,
                // Stub out @metamask/sdk-analytics — its Analytics() constructor calls
                // openapi-fetch.default() which crashes in webpack 5 ESM context.
                // We don't need analytics for Web3Auth Google login to work.
                "@metamask/sdk-analytics": path.resolve(
                    __dirname,
                    "src/stubs/metamask-analytics.js"
                ),
                // Stub out React Native storage module referenced by @metamask/sdk browser build
                "@react-native-async-storage/async-storage": path.resolve(
                    __dirname,
                    "src/stubs/async-storage.js"
                ),
                // Ignore farcaster optional packages that throw missing module errors
                "@farcaster/mini-app-solana": false,
                "@farcaster/miniapp-sdk": false,
            };

            webpackConfig.plugins = [
                ...webpackConfig.plugins,
                new webpack.ProvidePlugin({
                    process: "process/browser.js",
                    Buffer: ["buffer", "Buffer"],
                }),
            ];
            // Suppress source-map warnings from node_modules
            webpackConfig.ignoreWarnings = [/Failed to parse source map/];
            return webpackConfig;
        },
    },
};
