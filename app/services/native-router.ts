import Service, { service } from '@ember/service';
import Router from "@ember/routing/router";
import { setNextTransition } from 'ember-native/dom/native/FrameElement';
import { NavigationTransition } from '@nativescript/core';

export default class NativeRouter extends Service {
  @service router: Router;

  transitionTo(name: string, model: any, transition?: { transition: NavigationTransition, animated: boolean }) {
    setNextTransition(transition?.transition, transition?.animated);
    if (model) {
      this.router.transitionTo(name, model);
    } else {
      this.router.transitionTo(name);
    }
  }
}
