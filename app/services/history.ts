import Service, { service } from '@ember/service';
import { Application } from '@nativescript/core';
import {tracked} from "@glimmer/tracking";
import NativeRouter from '~/services/native-router';
import Router from '@ember/routing/router';

export default class HistoryService extends Service {
  @service nativeRouter: NativeRouter;
  @service router: Router;
  @tracked stack = [];

  setup() {
    Application.android?.on('activityBackPressed', (args) => {
      args.cancel = this.back();
    })
    this.router.on('routeDidChange', (transition) => {
      if (transition.from && !transition.data.isBack) {
        this.stack.push(transition);
      }
      this.stack = [...this.stack];
    })
  }

  back = () => {
    let transition = this.stack.pop();
    if (transition) {
      const h = transition.from;
      const nativeTransition = transition.data.transition;
      this.stack = [...this.stack];
      if (h.params.model) {
        transition = this.nativeRouter.transitionTo(h.name, h.params.model, {
          queryParams: h.queryParams
        }, nativeTransition);
      } else {
        transition = this.nativeRouter.transitionTo(h.name, null, {
          queryParams: h.queryParams
        }, nativeTransition);
      }
      transition.data.isBack = true;
      return true;
    }
    return false;
  }
}
