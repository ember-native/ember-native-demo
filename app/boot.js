import app from './main';
import { Application as NativeApplication } from '@nativescript/core/application/application';
import ElementNode from './lib/dom/nodes/ElementNode';


function boot() {
  return new Promise((resolve, reject) => {
    NativeApplication.on(NativeApplication.launchEvent, () => {
      setTimeout(() => {
        resolve()
      }, 5000)
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

globalThis.Element = ElementNode;
globalThis.Node = ElementNode;


boot().then(() => {
  console.log('visit');
  app.visit('/', {
    document: document,
    isInteractive: true
  })
});

globalThis.app = app;
