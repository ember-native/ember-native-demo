import Router from '@ember/routing/router';


Router.map(function () {
  this.route('auth', { path: '/' });
  this.route('index', { path: '/home' });
  this.route('list-view');
  this.route('rad-list-view');
  this.route('tabs');
  this.route('warp-drive');
});

export default Router;