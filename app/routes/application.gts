import RoutableComponentRoute from 'ember-routable-component';
import LinkTo from '../ui/components/link-to.gts';
import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import type ElementNode from '../lib/dom/nodes/ElementNode';

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
                viewInspection._showHighlight = (node, rect) => {
                    _showHighlight.call(this, node, rect);
                    const style = this.highlight.style;
                    this.highlight.style.width = this.highlight.style.width.value;
                    this.highlight.style.height = this.highlight.style.height.value;
                    const pos = this.absoluteLayout.nativeView.getLocationInWindow();
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
    }.bind(this));
    setupTooltip = modifier(function setupTooltip(element) {
        console.log('setupTooltip', element);
        this.tooltip = element;
    }.bind(this));
    <template>
        <page>
            <absoluteLayout {{ref this 'absoluteLayout'}}>
                <htmlView {{this.setupHighlight}} />
                <htmlView {{this.setupTooltip}} zIndex=99/>
                {{(this.setupInspector)}}
                <label text='Hello world 2!'></label>
                <LinkTo @route='test' @text="test" />
                {{outlet}}
            </absoluteLayout>
        </page>
    </template>
}

// this will generate a Route class and use the provided template
export default class ApplicationRoute extends RoutableComponentRoute(RoutableComponent) {
    activate() {
        console.log('activate');
    }
}
