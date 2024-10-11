import app from './main';
import { Application as NativeApplication } from '@nativescript/core/application/application';


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

const document = globalThis.document;
document.config = app.ENV;


boot().then(() => {
  console.log('visit');
  app.visit('/', {
    document: document
  })
});

globalThis.app = app;
