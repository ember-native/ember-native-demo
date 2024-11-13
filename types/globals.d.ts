type ViewBase = import('@nativescript/core').ViewBase;
type NativeElementNode<T extends ViewBase> =
  import('ember-native/dom/native/NativeElementNode').default<T>;

interface HTMLElementTagNameMap {
  'rad-list-view': NativeElementNode<import('nativescript-ui-listview').RadListView>;
  'rad-side-drawer': NativeElementNode<import('nativescript-ui-sidedrawer').RadSideDrawer>;
}
