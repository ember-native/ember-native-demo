import { Cursor } from '@glimmer/interfaces';
import { inTransaction } from '@glimmer/runtime';
import { ListViewEventData, ListViewViewType, RadListView } from 'nativescript-ui-listview';
import { isAndroid, isIOS, View } from '@nativescript/core';

import { createElement } from '../element-registry';
import ViewNode from '../nodes/ViewNode';
import { GlimmerKeyedTemplate } from './ListViewElement';
import NativeElementNode from './NativeElementNode';
import TemplateElement from './TemplateElement';

const Compilable = () => null;
const Application = {};


function renderItem(wrapper, template, item) {
    // const component = GlimmerResolverDelegate.lookupComponent(template.args.name);
    // const compiled = component.compilable.compile(Application.context);
    const cursor = { element: wrapper, nextSibling: null } as Cursor;
    let componentInstance = Application._renderComponent(null, cursor, template.compiled, {
        ...template.args,
        item
    });

    let nativeEl = wrapper.nativeView;
    (nativeEl as any).__GlimmerComponent__ = componentInstance._meta.component;
    return nativeEl;
}

export default class RadListViewElement extends NativeElementNode {
    lastItemSelected: any;
    component: any;
    constructor() {
        super('radlistview', RadListView, null);

        let nativeView = this.nativeView as RadListView;

        nativeView.itemViewLoader = (viewType: any): View => this.loadView(viewType);
        this.nativeView.on(RadListView.itemLoadingEvent, (args) => {
            this.updateListItem(args as ListViewEventData);
        });
        if (isIOS) {
            this.nativeView.on('itemLoadingInternal', (args) => {
                this.updateInternalItem(args as ListViewEventData);
            });
        }
    }

    private loadView(viewType: string): View {
        if (
            viewType.toLowerCase() == ListViewViewType.ItemView.toLowerCase() &&
            typeof this.nativeView.itemTemplates == 'object'
        ) {
            let keyedTemplate = this.nativeView.itemTemplates.find((t) => t.key == 'default');
            if (keyedTemplate) {
                return keyedTemplate.createView();
            }
        }

        let componentClass = this.getComponentForView(viewType);
        if (!componentClass) return null;
        console.log('creating view for ' + viewType);

        let wrapper = createElement('StackLayout') as NativeElementNode;
        wrapper.setStyle('padding', 0);
        wrapper.setStyle('margin', 0);
        let nativeEl = wrapper.nativeView;

        let builder = (props: any) => {
            inTransaction(Application.aotRuntime.env, () => {
                renderItem(wrapper, { compiled: componentClass.component, args: componentClass.args }, props);
            });
            // (nativeEl as any).__GlimmerComponent__ = componentInstance;
        };
        //for certain view types we like to delay until we have the data
        if (
            viewType.toLowerCase() == ListViewViewType.ItemView.toLowerCase() ||
            viewType.toLowerCase() == ListViewViewType.GroupView.toLowerCase()
            //    || viewType.toLowerCase() == ListViewViewType.ItemSwipeView.toLowerCase() doesn't work at the moment
        ) {
            (nativeEl as any).__GlimmerComponentBuilder__ = builder;
            builder({});
        } else {
            //otherwise, do it now
            builder({});
        }

        return nativeEl;
    }

    private getComponentForView(viewType: string): any {
        const normalizedViewType = viewType.toLowerCase();

        let templateEl = this.childNodes.find(
            (n) => n.tagName == 'template' && String(n.getAttribute('type')).toLowerCase() == normalizedViewType
        ) as any;
        if (!templateEl) return null;
        let component = Compilable(templateEl.component.args.src);
        const compiled = component.compile(Application.context);
        return {
            component: compiled,
            args: templateEl.component.args
        };
    }

    // loadView(viewType: string): View {
    //     if (viewType === ListViewViewType.ItemView) {
    //         console.log('creating view for ', viewType);
    //         let wrapper = createElement('StackLayout') as NativeElementNode;
    //         wrapper.setAttribute('class', 'list-view-item');
    //         const template = this.itemTemplateComponent as any;
    //         // const component = GlimmerResolverDelegate.lookupComponent(template.args.name);
    //         // const compiled = component.compilable.compile(Application.context);
    //         const cursor = { element: wrapper, nextSibling: null } as Cursor;
    //         let component = Compilable(template.args.src);
    //         const compiled = component.compile(Application.context);
    //         let componentInstance = Application._renderComponent(null, cursor, compiled, template.args);

    //         let nativeEl = wrapper.nativeView;
    //         (nativeEl as any).__GlimmerComponent__ = componentInstance._meta.component;
    //         return nativeEl;
    //     }
    // }

    // get itemTemplateComponent(): GlimmerComponent {
    //     const templateNode = this.childNodes.find((x) => x instanceof TemplateElement) as TemplateElement;
    //     return templateNode ? templateNode.component : null;
    // }

    // updateListItem(args: ListViewEventData) {
    //     let item;
    //     let listView = this.nativeView as RadListView;
    //     let items = listView.items;

    //     if (args.index >= items.length) {
    //         console.log("Got request for item at index that didn't exists", items, args.index);
    //         return;
    //     }

    //     if (items.getItem) {
    //         item = items.getItem(args.index);
    //     } else {
    //         item = items[args.index];
    //     }

    //     if (args.view && (args.view as any).__GlimmerComponent__) {
    //         let componentInstance = (args.view as any).__GlimmerComponent__;
    //         const oldState = componentInstance.state.value();
    //         // Update the state with the new item
    //         componentInstance.update({
    //             ...oldState,
    //             item
    //         });
    //     } else {
    //         console.log('got invalid update call with', args.index, args.view);
    //     }
    // }

    private updateViewWithProps(view: View, props: any) {
        let componentInstance: any;
        let _view = view as any;
        if (!_view.__GlimmerComponent__) {
            if (_view.__GlimmerComponentBuilder__) {
                console.log('mounting to view ' + view + ' with props ' + Object.keys(props).join(','));
                _view.__GlimmerComponentBuilder__(props);
                _view.__GlimmerComponentBuilder__ = null;
                return;
            }
        }

        if (_view.__GlimmerComponent__) {
            componentInstance = _view.__GlimmerComponent__;
        }

        if (componentInstance) {
            console.log('updating view ' + view + ' with props ' + Object.keys(props).join(','));
            inTransaction(Application.aotRuntime.env, () => {
                let componentInstance = (view as any).__GlimmerComponent__;
                const oldState = componentInstance.state.value();
                // Update the state with the new item
                componentInstance.update({
                    ...oldState,
                    item: props
                });
            });
        } else {
            console.error("Couldn't find component for ", view);
        }
    }

    private updateInternalItem(args: ListViewEventData) {
        //groups have index less than zero
        if (args.index < 0) {
            this.updateViewWithProps(args.view, args.view.bindingContext.category);
            return;
        }
    }

    private updateListItem(args: ListViewEventData) {
        let item;
        let listView = this.nativeView;
        let items = listView.items;

        if (args.index >= items.length) {
            console.log("Got request for item at index that didn't exist");
            return;
        }

        if (isAndroid && args.index < 0) {
            this.updateViewWithProps(args.view, args.view.bindingContext.category);
            return;
        }

        if (items.getItem) {
            item = items.getItem(args.index);
        } else {
            item = items[args.index];
        }

        this.updateViewWithProps(args.view, item);
    }

    get nativeView(): RadListView {
        return super.nativeView as RadListView;
    }

    set nativeView(view: RadListView) {
        super.nativeView = view;
    }

    onInsertedChild(childNode: ViewNode, index: number) {
        super.onInsertedChild(childNode, index);
        if (childNode instanceof TemplateElement && !childNode.getAttribute('type')) {
            let key = childNode.getAttribute('key') || 'default';
            console.info(`Adding template for key ${key}`);
            if (!this.nativeView.itemTemplates || typeof this.nativeView.itemTemplates == 'string') {
                this.nativeView.itemTemplates = [];
            }
            const keyedTemplate = new GlimmerKeyedTemplate(key, childNode);
            this.nativeView.itemTemplates = this.nativeView.itemTemplates.concat([keyedTemplate]);
        }
    }

    onRemovedChild(childNode: ViewNode) {
        super.onRemovedChild(childNode);
        if (childNode instanceof TemplateElement) {
            let key = childNode.getAttribute('key') || 'default';
            if (this.nativeView.itemTemplates && typeof this.nativeView.itemTemplates != 'string') {
                this.nativeView.itemTemplates = this.nativeView.itemTemplates.filter((t) => t.key != key);
            }
        }
    }
}
