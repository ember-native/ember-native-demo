import * as loader from 'loader.js';
import DocumentNode from '~/lib/dom/nodes/DocumentNode';
import { registerElements } from '~/lib/dom/setup-registry';

globalThis.requireModule = loader.require;
globalThis.requirejs = loader.require;
globalThis.define = loader.define;

globalThis.document = new DocumentNode();
registerElements();
