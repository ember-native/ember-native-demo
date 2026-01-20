import { modifier } from 'ember-modifier';

interface SetOnParentSignature {
  Element: Element;
  Args: {
    Positional: [propertyName: string];
  };
}

export default modifier<SetOnParentSignature>(
  (element, [propertyName]) => {
    const nativeElement = (element as any).nativeView;
    const parentElement = element.parent?.nativeView;
    console.log('setOnParent', element, parentElement, propertyName);

    if (parentElement && nativeElement) {
      // Set the child on the parent's property
      parentElement[propertyName] = nativeElement;
    }

    return () => {
      // Cleanup: remove the reference
      if (parentElement) {
        parentElement[propertyName] = null;
      }
    };
  }
);
