// Largely taken from the Vue implimentation
import { FormattedString, Span } from '@nativescript/core';
import { View } from '@nativescript/core';

import { registerElement } from './element-registry';
import FrameElement from './native/FrameElement';
import ListViewElement from './native/ListViewElement';
import NativeElementNode, { ComponentMeta } from './native/NativeElementNode';
import PageElement from './native/PageElement';
import RadListViewElement from './native/RadListViewElement';
import TemplateElement from './native/TemplateElement';
import ElementNode from './nodes/ElementNode';
import ViewNode from './nodes/ViewNode';

export function registerNativeElement(elementName: string, resolver: () => typeof View, meta: ComponentMeta = null) {
    registerElement(elementName, () => new NativeElementNode(elementName, resolver(), meta));
}

// export function registerElement(elementName, resolver, meta = null) {
//     const normalizedName = normalizeElementName(elementName);

//     meta = Object.assign({}, defaultViewMeta, meta);

//     if (elementMap[normalizedName]) {
//         throw new Error(`Element for ${elementName} already registered.`);
//     }

//     const entry = {
//         resolver: resolver,
//         meta: meta
//     };
//     elementMap[normalizedName] = entry;
// }

export function registerElements() {
    registerElement('head', () => null, {
        insertChild(parentNode, childNode, atIndex) {}
    });
    registerElement('style',  () => new ElementNode('style', this));
    // registerElement('Frame', () => require('@nativescript/core/ui/frame').Frame, {
    //     insertChild(parentNode, childNode, atIndex) {
    //         //dont bother
    //     }
    // });

    registerElement('div', () => require('@nativescript/core/ui/frame').Frame, {
        insertChild(parentNode, childNode, atIndex) {
          console.log('div elem', parentNode, childNode, atIndex);
            //dont bother
            parentNode.appendChild(childNode);
        }
    });

    // Completed
    registerNativeElement(
        'AbsoluteLayout',
        () => require('@nativescript/core/ui/layouts/absolute-layout').AbsoluteLayout
    );
    registerNativeElement('ActionBar', () => require('@nativescript/core/ui/action-bar').ActionBar);
    registerNativeElement('ActionItem', () => require('@nativescript/core/ui/action-bar').ActionItem);
    registerNativeElement(
        'ActivityIndicator',
        () => require('@nativescript/core/ui/activity-indicator').ActivityIndicator
    );
    registerNativeElement('Border', () => require('@nativescript/core/ui/border').Border);
    registerNativeElement('Comment', () => require('@nativescript/core/ui/placeholder').Placeholder);
    registerNativeElement('Button', () => require('@nativescript/core/ui/button').Button);
    registerNativeElement('DatePicker', () => require('@nativescript/core/ui/date-picker').DatePicker);
    registerNativeElement('DockLayout', () => require('@nativescript/core/ui/layouts/dock-layout').DockLayout);
    registerNativeElement('FlexboxLayout', () => require('@nativescript/core/ui/layouts/flexbox-layout').FlexboxLayout);
    registerNativeElement('FormattedString', () => require('@nativescript/core/text/formatted-string').FormattedString, {
        insertChild(parentNode: ViewNode, childNode: ViewNode, atIndex) {
            const parent = parentNode.nativeView as FormattedString;
            const child = childNode.nativeView as Span;
            parent.spans.splice(atIndex, 0, child);
        }
    });
    registerNativeElement('GridLayout', () => require('@nativescript/core/ui/layouts/grid-layout').GridLayout);
    registerNativeElement('HtmlView', () => require('@nativescript/core/ui/html-view').HtmlView);
    registerNativeElement('Image', () => require('@nativescript/core/ui/image').Image);
    registerNativeElement('Label', () => require('@nativescript/core/ui/label').Label);
    registerNativeElement('ListPicker', () => require('@nativescript/core/ui/list-picker').ListPicker);
    registerNativeElement('NavigationButton', () => require('@nativescript/core/ui/action-bar').NavigationButton);
    // registerNativeElement('Page', () => require('@nativescript/core/ui/page').Page);
    registerNativeElement('Span', () => require('@nativescript/core/text/span').Span);
    registerNativeElement('StackLayout', () => require('@nativescript/core/ui/layouts/stack-layout').StackLayout);
    registerNativeElement('ScrollView', () => require('@nativescript/core/ui/scroll-view').ScrollView);
    registerNativeElement('Switch', () => require('@nativescript/core/ui/switch').Switch);
    registerNativeElement(
        'TabContentItem',
        () => require('@nativescript/core/ui/tab-navigation-base/tab-content-item').TabContentItem
    );
    registerNativeElement('Tabs', () => require('@nativescript/core/ui/tabs').Tabs);
    registerNativeElement('TabStrip', () => require('@nativescript/core/ui/tab-navigation-base/tab-strip').TabStrip);
    registerNativeElement(
        'TabStripItem',
        () => require('@nativescript/core/ui/tab-navigation-base/tab-strip-item').TabStripItem
    );
    registerNativeElement('TabView', () => require('@nativescript/core/ui/tab-view').TabView);
    registerNativeElement('TabViewItem', () => require('@nativescript/core/ui/tab-view').TabViewItem);
    registerNativeElement('TextField', () => require('@nativescript/core/ui/text-field').TextField);
    registerNativeElement('TextView', () => require('@nativescript/core/ui/text-view').TextView);
    registerNativeElement('WebView', () => require('@nativescript/core/ui/web-view').WebView);
    registerNativeElement('WrapLayout', () => require('@nativescript/core/ui/layouts/wrap-layout').WrapLayout);
    registerNativeElement('ContentView', () => require('@nativescript/core/ui/content-view').ContentView);

    // Not Complete
    registerElement('ListView', () => new ListViewElement());
    registerElement('RadListView', () => new RadListViewElement());
    registerElement('Template', () => new TemplateElement());
    registerElement('Frame', () => new FrameElement());
    registerElement('Page', () => new PageElement());
    registerElement('Fragment', () => new ElementNode('fragment', this));
}
