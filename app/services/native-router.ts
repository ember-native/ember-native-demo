import Service, { service } from '@ember/service';
import Router from "@ember/routing/router";
import { setNextTransition } from 'ember-native/dom/native/FrameElement';
import { NavigationTransition } from '@nativescript/core';
import { Transition } from 'router_js';

export default class NativeRouter extends Service {
  @service router: Router;

  transitionTo(name: string, model: any, queryParams?: Record<string, any>, transition?: { transition: NavigationTransition, animated: boolean }) {
    setNextTransition(transition?.transition, transition?.animated);
    let t: Transition;
    if (model) {
      t = this.router.transitionTo(name, model, { queryParams });
    } else {
      t = this.router.transitionTo(name, { queryParams });
    }
    t.data.transition = transition;
    return t;
  }
}
