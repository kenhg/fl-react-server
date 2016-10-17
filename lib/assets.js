'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;
exports.jsAssets = jsAssets;
exports.cssAssets = cssAssets;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function getAssetJSON(webpackAssetsPath) {
  return process.env.NODE_ENV === 'development' ? JSON.parse(require('fs').readFileSync(webpackAssetsPath).toString()) : require(webpackAssetsPath);
}

function jsAssets(entries, webpackAssetsPath) {
  var assets = getAssetJSON(webpackAssetsPath);
  return _lodash2['default'](entries).map(function (e) {
    return assets[e].js;
  }).compact().value();
}

function cssAssets(entries, webpackAssetsPath) {
  if (process.env.NODE_ENV === 'development') return [];
  var assets = getAssetJSON(webpackAssetsPath);
  return _lodash2['default'](entries).map(function (e) {
    return assets[e].css;
  }).compact().value();
}