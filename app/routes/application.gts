import RoutableComponentRoute from 'ember-routable-component';
import LinkTo from '../ui/components/link-to.gts';
import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import type ElementNode from '../lib/dom/nodes/ElementNode';
import { service } from '@ember/service';
import { Frame } from '@nativescript/core/ui/frame';
import ENV from '~/env';
import { Page } from '@nativescript/core/ui/page';
import { Application } from '@nativescript/core';

const ref = modifier(function setRef(element, [context, key]) {
    // console.log('ref', element, context, key);
    context[key] = element;
})

class RoutableComponent extends Component {
    highlight: ElementNode;
    tooltip: ElementNode;
    setupInspector = () => {
        let i = setInterval(() => {
            const viewInspection = globalThis.EmberInspector?.viewDebug?.viewInspection;
            if (viewInspection) {
                this.tooltip.querySelector = () => {
                    return {
                        style: {}
                    }
                }
                viewInspection._showTooltip = (node, rect) => {

                }
                const _showHighlight = viewInspection._showHighlight;
                viewInspection._hideHighlight = () => {
                    this.highlight.setAttribute('visibility', 'collapse');
                }
                viewInspection._showHighlight = (node, rect) => {
                    _showHighlight.call(this, node, rect);
                    this.highlight.setAttribute('visibility', 'visible');
                    const style = this.highlight.style;
                    this.highlight.style.width = this.highlight.style.width.value;
                    this.highlight.style.height = this.highlight.style.height.value;
                    const pos = this.page.nativeView.getLocationInWindow() || {
                        x: 0,
                        y: 0
                    };
                    this.highlight.setAttribute('left', style.left.replace('px', '') - pos.x);
                    this.highlight.setAttribute('top', style.top.replace('px', '') - pos.y);
                }
                viewInspection.highlight = this.highlight;
                viewInspection.tooltip = this.tooltip;
                const id = viewInspection.id;

                viewInspection.highlight.id = `ember-inspector-highlight-${id}`;
                viewInspection.tooltip.id = `ember-inspector-tooltip-${id}`;
                clearInterval(i);
            }
        }, 1000);
    }

    setupHighlight = modifier(function setupHighlight(element) {
        console.log('setupHighlight', element);
        this.highlight = element;
        this.highlight.setAttribute('visibility', 'collapse');
    }.bind(this));
    setupTooltip = modifier(function setupTooltip(element) {
        console.log('setupTooltip', element);
        this.tooltip = element;
        this.tooltip.setAttribute('visibility', 'collapse');

    }.bind(this));
    <template>
        <absoluteLayout {{ref this 'page'}}>
            <htmlView {{this.setupHighlight}} />
            <htmlView {{this.setupTooltip}} zIndex=99 />
            {{(this.setupInspector)}}
            <contentView left="0" top="0" width="100%" height="100%">
                <frame>
                    {{outlet}}
                </frame>
            </contentView>
        </absoluteLayout>
    </template>
}


export default class ApplicationRoute extends RoutableComponentRoute(RoutableComponent) {
    @service history;

    init(...args) {
        super.init(...args)
        this.history.setup();
    }

    activate() {
        console.log('activate');
    }
}
