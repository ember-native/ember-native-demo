import app from './main';
import { Application as NativeApplication } from '@nativescript/core/application/application';
import DocumentNode from './lib/dom/nodes/DocumentNode';
import {DOMDomainDebugger} from "@nativescript/core/debugger/webinspector-dom";
import * as inspectorCommandTypes from "@nativescript/core/debugger/InspectorBackendCommands";
import * as inspectorCommands from '@nativescript/core/debugger/InspectorBackendCommands';


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

boot().then(() => {
  console.log('visit');

  app.visit('/', {
    document: document
  })
});

DOMDomainDebugger.prototype.resolveNode = ((params) => {
  const n = document.nodeMap.get(params.nodeId);
  console.log(n);

  return {
    object: {
      type: 'object',
      className: n.constructor.name,
      value: n,
      objectId: 'dont know'
    }
  };
});

let EmberDomain = class EmberDomain {
  fromExtension(...args) {
    console.log('ember fromExtension', ...args);
  }
}

EmberDomain = __decorate([
  inspectorCommands.DomainDispatcher('Ember'),
  __metadata("design:paramtypes", [])
], EmberDomain);

setInterval(() => {
  return;
  __inspectorSendEvent(JSON.stringify({
    id: Math.random() * 200000,
    method: 'Ember.toExtension',
    params: {
      test: 'x'
    },
  }));
}, 5000);

globalThis.app = app;
