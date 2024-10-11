import { service } from '@ember/service';
import Component from '@glimmer/component';
import { NavigationTransition, NavigationEntry } from '@nativescript/core';
import { on } from '@ember/modifier'

export interface LinkToInterface {
    Args: {
        route: string;
        text: string;
        model?: any;
        frame?: any;
        context?: any;
        animated?: boolean;
        backstackVisible?: boolean;
        clearHistory?: boolean;
        transition?: NavigationTransition;
        transitionAndroid?: NavigationTransition;
        transitioniOS?: NavigationTransition;
    }
}


export default class LinkTo extends Component<LinkToInterface> {
    @service router;
    onClick = () => {
        const args = this.args;
        const options: NavigationEntry = {
            animated: args.animated,
            backstackVisible: args.backstackVisible,
            clearHistory: args.clearHistory,
            transition: args.transition,
            transitionAndroid: args.transitionAndroid,
            transitioniOS: args.transitioniOS
        };
        this.router.transitionTo(this.args.route, this.args.model, options);
    }
    <template>
        {{#if (has-block)}}
            <flexboxLayout ...attributes class="link-to" {{on 'tap' this.onClick}}>
                {{yield}}
            </flexboxLayout>
        {{else}}
            <button ...attributes text={{@text}} class="btn link-to" {{on 'tap' this.onClick}}></button>
        {{/if}}
    </template>
}
