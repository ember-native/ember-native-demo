import app from './main';
import { Application as NativeApplication } from '@nativescript/core/application/application';
import DocumentNode from './lib/dom/nodes/DocumentNode';


function boot() {
  return new Promise((resolve, reject) => {
    NativeApplication.on(NativeApplication.launchEvent, () => {
      resolve()
    });
    try {
      NativeApplication.run({ create: () => {
          return app.rootElement.nativeView;
        } });
    } catch (e) {
      reject(e);
    }
  });
}

boot().then(() => {
  console.log('visit');
  app.visit('/', {
    document: new DocumentNode()
  })
});

globalThis.app = app;
