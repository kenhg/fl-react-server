'use strict';

exports.__esModule = true;
exports['default'] = createServerRenderer;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _queueAsync = require('queue-async');

var _queueAsync2 = _interopRequireDefault(_queueAsync);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDomServer = require('react-dom/server');

var _historyLibCreateMemoryHistory = require('history/lib/createMemoryHistory');

var _historyLibCreateMemoryHistory2 = _interopRequireDefault(_historyLibCreateMemoryHistory);

var _reactRedux = require('react-redux');

var _reduxRouter = require('redux-router');

var _reduxRouterServer = require('redux-router/server');

var _reactHelmet = require('react-helmet');

var _reactHelmet2 = _interopRequireDefault(_reactHelmet);

var _fetchComponentData = require('fetch-component-data');

var _assets = require('./assets');

var sendError = function sendError(res, err) {
  console.log(err);
  return res.status(500).send('Error loading initial state');
};

var defaults = {
  entries: ['shared', 'app'],
  webpackAssetsPath: _path2['default'].resolve(__dirname, '../../../webpack-assets.json')
};

function createServerRenderer(_options) {
  var options = _lodash2['default'].extend({}, defaults, _options);
  var createStore = options.createStore;
  var getRoutes = options.getRoutes;
  var _options$config = options.config;
  var config = _options$config === undefined ? {} : _options$config;

  var alwaysFetch = options.alwaysFetch || [];
  if (!_lodash2['default'].isArray(alwaysFetch)) alwaysFetch = [alwaysFetch];
  if (!createStore) throw new Error('[fl-react-server] createServerRenderer: Missing createStore from options');
  if (!getRoutes) throw new Error('[fl-react-server] createServerRenderer: Missing getRoutes from options');

  return function app(req, res) {
    var queue = new _queueAsync2['default'](1);

    var serverState = {
      auth: req.user ? { user: _lodash2['default'].omit(req.user.toJSON(), 'password', '_rev') } : {}
    };
    if (options.loadInitialState) {
      queue.defer(function (callback) {
        return options.loadInitialState(req, function (err, state) {
          if (err) return callback(err);
          callback(null, _lodash2['default'].merge(serverState, state));
        });
      });
    }
    if (_lodash2['default'].isFunction(config)) {
      queue.defer(function (callback) {
        return config(req, function (err, _config) {
          if (err) return callback(err);
          callback(null, serverState.config = _config);
        });
      });
    } else {
      serverState.config = config;
    }
    queue.await(function (err) {
      if (err) return sendError(res, err);

      var store = createStore(_reduxRouterServer.reduxReactRouter, getRoutes, _historyLibCreateMemoryHistory2['default'], serverState);

      store.dispatch(_reduxRouterServer.match(req.originalUrl, function (err, redirectLocation, routerState) {
        if (err) return sendError(res, err);
        if (redirectLocation) return res.redirect(redirectLocation.pathname + redirectLocation.search);
        if (!routerState) return res.status(404).send('Not found');

        var components = _lodash2['default'].uniq(alwaysFetch.concat(routerState.components));

        _fetchComponentData.fetchComponentData({ store: store, components: components }, function (err, fetchResult) {
          if (err) return sendError(res, err);
          if (fetchResult.status) res.status(fetchResult.status);

          var initialState = store.getState();

          // temp solution to rendering admin state
          // todo: make this better. don't include admin reducers / route unless requested
          if (options.omit) initialState = _lodash2['default'].omit(initialState, options.omit);

          // https://github.com/rackt/redux-router/issues/106
          routerState.location.query = req.query;

          var component = _react2['default'].createElement(
            _reactRedux.Provider,
            { store: store, key: 'provider' },
            _react2['default'].createElement(_reduxRouter.ReduxRouter, null)
          );

          var js = _assets.jsAssets(options.entries, options.webpackAssetsPath);
          var scriptTags = js.map(function (script) {
            return '<script type="application/javascript" src="' + script + '"></script>';
          }).join('\n');

          var css = _assets.cssAssets(options.entries, options.webpackAssetsPath);
          var cssTags = css.map(function (c) {
            return '<link rel="stylesheet" type="text/css" href="' + c + '">';
          }).join('\n');

          var rendered = _reactDomServer.renderToString(component);
          var head = _reactHelmet2['default'].rewind();

          var html = '\n            <!DOCTYPE html>\n            <html>\n              <head>\n                ' + head.title + '\n                ' + head.base + '\n                ' + head.meta + '\n                ' + head.link + '\n                ' + head.script + '\n\n                ' + cssTags + '\n                <script type="application/javascript">\n                  window.__INITIAL_STATE__ = ' + JSON.stringify(initialState) + '\n                </script>\n              </head>\n              <body id="app">\n                <div id="react-view">' + rendered + '</div>\n                ' + scriptTags + '\n              </body>\n            </html>\n          ';
          res.type('html').send(html);
        });
      }));
    });
  };
}

module.exports = exports['default'];