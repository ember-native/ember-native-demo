import Router from '@ember/routing/router';


Router.map(function () {
  this.route('pokemon', function () {
    this.route('pokemon', { path: ':pokemon_id' });
  });
  this.route('about');
});

export default Router;
