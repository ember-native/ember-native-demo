'use strict';

module.exports = function (environment) {
  const ENV = {
    modulePrefix: 'ember-native-demo',
    environment,
    rootURL: '/',
    locationType: 'history',
    EmberENV: {
      FEATURES: {},
      EXTEND_PROTOTYPES: false,
      _JQUERY_INTEGRATION: false,
      _APPLICATION_TEMPLATE_WRAPPER: false,
      _DEFAULT_ASYNC_OBSERVERS: true,
      _TEMPLATE_ONLY_GLIMMER_COMPONENTS: true,
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },
  };

  return ENV;
};
