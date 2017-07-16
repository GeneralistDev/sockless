const path = require('path');
const webpack = require('webpack');

module.exports = {
    context: __dirname,
    entry: {
        Sockless: "./sockless.js"
    },
    output: {
        path: __dirname,
        filename: "sockless.min.js"
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
    devtool: "source-map",
    target: "web",
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false }
        })
    ]
}