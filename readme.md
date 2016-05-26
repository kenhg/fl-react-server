# Helper functions for the server side of FounderLab apps

#####backbone-rest render example:
```javascript
...
import {render} from 'fl-server-utils'

const detail = (applications, options, callback) => {
  // applications are a list of plain objects (not backbone models)
  callback(null, _.pick(applications, 'id'))
}
detail.$raw = true // flag it as raw

export default class ApplicationsController extends RestController {
  constructor(options) {
    super(options.app, _.defaults({
      model_type: Application,
      route: '/api/applications',
      auth: [...options.auth, createAuthMiddleware({canAccess})],
      templates: {
        detail: detail,
      },
      default_template: 'detail',
    }, options))
    // Overwrite the render method, making sure to bind it to the controller
    this.render = render.bind(this)
  }
}
```

#####createServerRenderer:
Helper method that takes care of a bunch of bs boilerplate for rendering react components server side. 
Usage: 

```javascript
app.get('*', createServerRenderer({
  createStore, 
  getRoutes,
  scripts: _.map(_.pick(require('../../webpack-assets.json'), ['shared.js', 'app']), entry => entry.js),
  omit: 'admin',
  alwaysFetch: require('../../shared/modules/app/containers/App'),
  config: _.pick(config, config.clientConfigKeys),
}))
```
