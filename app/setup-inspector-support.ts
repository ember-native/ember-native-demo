import { DOMDomainDebugger } from '@nativescript/core/debugger/webinspector-dom';
import * as inspectorCommands from '@nativescript/core/debugger/InspectorBackendCommands';
import config from './env';
import { RSVP } from '@ember/-internals/runtime';
import Ember from 'ember';
import * as tracking from '@glimmer/tracking';
import * as runtime from '@glimmer/runtime';
import * as validator from '@glimmer/validator';
import ElementNode from './lib/dom/nodes/ElementNode';

console.log('inspector support');

globalThis.HTMLElement = ElementNode;
globalThis.window = globalThis;

window.define('@glimmer/tracking', () => tracking);
window.define('@glimmer/runtime', () => runtime);
window.define('@glimmer/validator', () => validator);
window.define('rsvp', () => RSVP);
window.define('ember', () => ({ default: Ember }));
window.define('doc-app/config/environment', () => ({
  default: config,
}));

console.debug = console.log;

globalThis.postMessage = () => {
  console.log('window.postMessage');
}

globalThis.addEventListener = () => {
  console.log('window.addEventListener');
}

globalThis.removeEventListener = () => {
  console.log('window.removeEventListener');
}

class Port {
  private msgId: number;
  constructor() {
    console.log('port');
    this.msgId = 20000;
  }
  addEventListener(...args) {
    console.log('addEventListener', ...args)
  }
  postMessage(msg) {
    console.log('send', msg);
    __inspectorSendEvent(JSON.stringify({
      id: this.msgId++,
      method: 'Ember.toExtension',
      params: msg,
    }));
  }
}

class MessageChannel {
  port1 = new Port();
  port2 = new Port();
}

globalThis.MessageChannel = MessageChannel;




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
  fromExtension(msg) {
    console.log('ember fromExtension', msg);
    if (msg.type === 'inject-code') {
      console.log('inject');
      try {
        eval('console.log("hi")');
        eval(msg.value);
      } catch(e) {
        console.error(e)
      }
    }
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
