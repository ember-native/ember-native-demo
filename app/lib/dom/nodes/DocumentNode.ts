import { createElement } from '../element-registry';
import CommentNode from './CommentNode';
import ElementNode from './ElementNode';
import PropertyNode from './PropertyNode';
import TextNode from './TextNode';
import ViewNode from './ViewNode';

function* elementIterator(el: any) {
  yield el;
  for (let child of el.childNodes) {
    yield* elementIterator(child);
  }
}

class HeadNode extends ElementNode {
  private document: any;
  constructor(tagName, document) {
    super(tagName);
    this.document = document;
  }
  appendChild(childNode: ViewNode) {
    if (childNode.tagName === 'style') {
      this.document.page.nativeView.addCss(childNode.childNodes[0].text);
      return;
    }
    super.appendChild(childNode);
  }
}

export default class DocumentNode extends ViewNode {
  head: any;
  nodeMap: Map<any, any>;
  page: ElementNode;
  body: ElementNode;
  documentElement = {
    dataset: {}
  }

  constructor() {
    super();
    this.tagName = 'docNode';
    this.nodeType = 9;
    this.head = new HeadNode('head', this);
    this.appendChild(this.head);
    this.nodeMap = new Map();
  }

  createComment(text) {
    return new CommentNode(text);
  }

  createPropertyNode(tagName: string, propertyName: string): PropertyNode {
    return new PropertyNode(tagName, propertyName);
  }

  createElement(tagName) {
    if (tagName.indexOf('.') >= 0) {
      let bits = tagName.split('.', 2);
      return this.createPropertyNode(bits[0], bits[1]);
    }
    console.log(createElement(tagName));
    const e = createElement(tagName);
    if (e.nativeView) {
      this.nodeMap.set(e.nativeView._domId, e);
    }
    if (tagName === 'page') {
      this.page = e;
      this.body = e;
    }
    return e;
  }

  createElementNS(namespace, tagName) {
    return this.createElement(tagName);
  }

  createTextNode(text) {
    console.log('createTextNode', text);
    return new TextNode(text);
  }

  getElementById(id) {
    for (let el of elementIterator(this)) {
      if (el.nodeType === 1 && el.id === id) return el;
    }
  }

  addEventListener(event, callback) {
    if (event === 'DOMContentLoaded') {
      setTimeout(callback, 0);
      return;
    }
    console.error('unsupported event on document', event);
  }

  removeEventListener(event, handler) {
    if (event === 'DOMContentLoaded') {
      return;
    }
    console.error('unsupported event on document', event);
  }

  querySelectorAll(selector) {
    if (selector.startsWith('meta')) {
      return {
        getAttribute() {
          return JSON.stringify(this.config);
        }
      }
    }
  }
}
