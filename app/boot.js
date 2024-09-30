import app from './main';
import { Application as NativeApplication } from '@nativescript/core/application/application';
import DocumentNode from './lib/dom/nodes/DocumentNode';
import ENV from 'app/env';


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

const document = globalThis.document = new DocumentNode();
document.config = app.ENV;

boot().then(() => {
  console.log('visit');

  app.visit('/', {
    document: document
  })
});

globalThis.app = app;
