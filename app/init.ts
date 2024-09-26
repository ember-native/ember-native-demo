import ENV from './env';
import registry from './registry';
import type ApplicationClass from '@ember/application';
import type RouteClass from './router';
import {registerElements} from "~/lib/dom/setup-registry";


export function init(
  Application: typeof ApplicationClass,
  Router: typeof RouteClass
) {
  // Init initializers
  // Application.initializer(initializer);
  // Application.initializer(emberDataInitializer);
  // Application.initializer(emberResponsive);
  //
  // // Init instance initializers
  // Application.instanceInitializer(logger);
  // Application.instanceInitializer(modalDialog);
  registerElements();

  const app = Application.create({
    name: ENV.modulePrefix,
    version: ENV.APP.version,
  });

  const registryObjects = registry();

  Object.keys(registryObjects).forEach((key) => {
    const value = registryObjects[key];
    app.register(key, value);
  });

  app.register('config:environment', ENV);
  app.register('router:main', Router);

  return app;
}
