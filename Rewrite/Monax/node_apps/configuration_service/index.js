const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = require('fs');

const port = process.env.PORT || 9590;

const log = async (msg, ...args) => {
  if (args.length > 0) {
    console.log(msg, args);
  } else {
    console.log(msg);
  }
};

const app = express();

log('=> Initializing dependencies.');
log('Registering body parser.');
app.use(bodyParser.json());

log('Registering morgan handler.');
app.use(morgan('tiny'));

const loadRouteDefinitions = (cb) => {
  log('Loading route definitions and configuration.');
  let obj;
  let error;

  fs.readFile('routes.json', (err, data) => {
    if (err) {
      obj = undefined;
      log(err);
      log('Encountered error while reading routes.json');
    } else {
      try {
        obj = JSON.parse(data);
      } catch (e) {
        log(e);
        log('Encountered error while parsing route configuration.');
      }
    }

    cb(error, obj);
  });
};

let routeCount = 0; // confirmed working routes

/* eslint-disable global-require, import/no-dynamic-require */
const mount = (appRef, routesData) => {
  const basePath = routesData.base_url || '/config';
  log(`Mounting routes using ${basePath}.`);

  const routes = Object.keys(routesData.routes);
  log(`Registering ${routes.length} routes with application listener.`);
  routes.forEach((key) => {
    log(`Reading data for route key: ${key}`);
    log(`Registering routes for GET ${routesData.routes[key].route}.`);
    try {
      app.all(`${basePath}${routesData.routes[key].route}`, require(routesData.routes[key].module));
      routeCount++;
    } catch (e) {
      log(`Unable to register route for GET ${routesData.routes[key].route}.`);
      log(e);
    }
  });
};

log('=> Starting.');
let routeConfig;
loadRouteDefinitions((err, defs) => {
  routeConfig = defs;

  log('=> Registering Authorization handler.');
  app.use((req, res, next) => {
    const authHeader = req.get('Authorization');
    if (authHeader !== undefined) {
      if (authHeader === routeConfig.secret) {
        next();
      } else {
        log(`Authorization refused for IP ${req.ip}: Incorrect Authorization Key.`);
        res.status(401).json({ message: 'Incorrect Authorization Key.' });
      }
    } else {
      log(`Authorization refused for IP ${req.ip}: Missing Authorization Key.`);
      res.status(401).json({ message: 'Missing Authorization Key.' });
    }
  });

  log('=> Mounting routes.');
  mount(app, routeConfig);

  app.listen(port, () => {
    log(`=> Service listening on port ${port}, with ${routeCount} working routes.`);
  });
});
