const path = require('path');
const webpack = require('webpack');

module.exports = {
    context: __dirname,
    entry: __dirname + "/src/sockless.js",
    output: {
        path: __dirname,
        filename: "sockless.js",
        library: "sockless",
        libraryTarget: "umd",
        umdNamedDefine: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["env"]
                    }
                }
            }
        ]
    },
    resolve: {
        modules: [
            "node_modules"
        ],
        extensions: [".js"]
    },
    devtool: "source-map"
}