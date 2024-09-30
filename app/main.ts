import './setup';
import './setup-inspector-support';
import App from  './app';
import Router from './router';
import { init } from './init';

export default init(App, Router);
