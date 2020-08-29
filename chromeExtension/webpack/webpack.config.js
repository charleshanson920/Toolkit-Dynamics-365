const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const dotenv = require('dotenv');
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin');
const Package = require('../package.json');
const webpack = require('webpack');
const WebpackCrx = require('./webpack-crx');
const ZipPlugin = require('zip-webpack-plugin');

const currentEnv = dotenv.config({ path: path.resolve(__dirname, '..', '.env') }).parsed;
const sourceFolder = path.resolve(__dirname, '..', 'src');
const destFolder = path.resolve(__dirname, '..', 'dist');

function updateManifest(buffer) {
    // copy-webpack-plugin passes a buffer
    let manifest = JSON.parse(buffer.toString());

    manifest.version = Package.version;

    // pretty print to JSON with two spaces
    return JSON.stringify(manifest, null, 4);
}

module.exports = {
    entry: {
        launcher: path.resolve(sourceFolder, 'launcher.js'),
        toolkit: path.resolve(sourceFolder, 'toolkit.js')
    },
    output: {
        path: destFolder,
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.css$/i,
                use: [ExtractCssChunks.loader,
                    'css-loader']
            },
            {
                test: /\.(png|jpg|gif)$/i,
                loader: 'url-loader',
                options: {
                    limit: 100000
                }
            }
        ]
    },
    plugins: [
        new webpack.EnvironmentPlugin(Object.keys(currentEnv)),
        new ExtractCssChunks({
            filename: '[name].css'
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(sourceFolder, 'manifest.json'),
                    to: path.resolve(destFolder, 'manifest.json'),
                    transform(content, path) {
                        return updateManifest(content);
                    }
                },
                {
                    from: path.resolve(__dirname, '..', 'public'),
                    to: destFolder
                }
            ]
        }),
        new WebpackCrx({
            key: path.resolve(__dirname, '..', 'key.pem'),
            src: destFolder,
            dest: path.resolve(__dirname, '..', 'tests/integration'),
            name: 'test_extension',
            version: Package.version
        }),
        new ZipPlugin({
            filename: 'extension.zip'
        })
    ]
};