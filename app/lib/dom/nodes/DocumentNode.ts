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
      console.log('append style', this.document.page);
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
    e._ownerDocument = this;
    if (e.nativeView) {
      this.nodeMap.set(e.nativeView._domId, e);
    }
    if (tagName === 'page') {
      this.page = e;

      Object.defineProperty(this, 'body', {
        get() {
          let page =  this.page;
          return {
            insertAdjacentHTML(location, html) {
              const e = globalThis.document.createElement('HtmlView');
              e.html = html;
              console.log('insertAdjacentHTML', html);
              page.firstChild.appendChild(e);
            },
            addEventListener: globalThis.addEventListener.bind(this.page),
            get lastChild() {
              return page.firstChild.lastChild;
            }
          }
        }
      })
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

  searchDom(node, startNode, endNode) {
    const start = startNode || this.page;
    if (start === node) {
      return true;
    }
    if (node === endNode) {
      return false;
    }
    for (const childNode of start.childNodes) {
      if (this.searchDom(node, childNode, endNode)) {
        return true;
      }
    }
    let sibling = node;
    while (sibling) {
      if (this.searchDom(node, sibling, endNode)) {
        return true;
      }
      sibling = sibling.nextSibling;
    }
    return false;
  }

  createRange() {
    let self = this;
    return {
      startNode: null as ViewNode | null,
      endNode: null as ViewNode | null,
      setStartBefore(startNode) {
        while (startNode && !startNode.nativeView) {
          startNode = startNode.nextSibling;
        }
        this.startNode = startNode;
      },
      setEndAfter(endNode) {
        while (endNode && !endNode.nativeView) {
          endNode = endNode.prevSibling;
        }
        this.endNode = endNode;
      },
      isPointInRange(dom, number) {
        return self.searchDom(dom, this.startNode, this.endNode);
      },
      getBoundingClientRect() {
        if (!this.startNode.nativeView) return null;
        const point1 = this.startNode.nativeView.getLocationInWindow();
        const point2 = this.endNode.nativeView.getLocationInWindow();
        const x = Math.min(point1.x, point2.x);
        const y = Math.min(point1.y, point2.y);
        return {
          x,
          y,
          width: Math.max(point1.width, point2.width) - x,
          height: Math.max(point1.height, point2.height) - y,
        }
      }
    }
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
