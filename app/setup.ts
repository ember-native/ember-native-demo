import * as loader from 'loader.js';

globalThis.requireModule = loader.require;
globalThis.requirejs = loader.require;
globalThis.define = loader.define;
