var VirtualDom = (function (exports) {
  'use strict';

  function isVNode$1(x) {
    return x && x.type === "VirtualNode"
  }
  function isVText$1(x) {
    return x && x.type === "VirtualText"
  }
  function isArray(x) {
    return Array.isArray(x)
  }

  // 构建虚拟节点
  class VNode {
    constructor(tagName, properties, children) {
      this.tagName = tagName;
      this.properties = properties || {};
      this.children = children || [];

      var count = (children && children.length) || 0;
      var descendants = 0;

      this.children.forEach(child => {
        if(isVNode$1(child)) {
          descendants += child.count || 0;
        }
      });
      this.count = count + descendants; // 所有子虚拟节点的数量
    }
  }
  VNode.prototype.type = 'VirtualNode';

  // 虚拟文本节点
  class VText {
    constructor(text) {
      this.text = String(text);
    }
    type() {
      return "VirtualText"
    }
  }
  VText.prototype.type = 'VirtualText';

  // 创建虚拟节点，为了构建虚拟DOM树，其实对VNode的封装,增加其灵活性
  function h(tagName, properties, children) {
    var childNodes = [];
    var props;

    // 当没传properties，children会当成properties，这里做转化
    if (!children && isChildren(properties)) {
      children = properties;
      props = {};
    }

    props = props || properties || {};
    // tag = parseTag(tagName, props)

    if (children !== undefined && children !== null) {
      addChild(children, childNodes);
    }

    return new VNode(tagName, props, childNodes)
  }
  function addChild(children, childNodes) {
    if (typeof children === 'string') {
      childNodes.push(new VText(children));
    } else if (typeof children === 'number') {
      childNodes.push(new VText(String(children)));
    } else if (isChild(children)) {
      childNodes.push(children);
    } else if (isArray$1(children)) {
      children.forEach(child => {
        addChild(child, childNodes);
      });
    } else {
      return
    }
  }
  function isChild(x) {
    return isVNode$1(x) || isVText$1(x);
  }

  function isChildren(x) {
    return typeof x === 'string' || isArray$1(x) || isChild(x);
  }
  function isArray$1(x) {
    return Array.isArray(x)
  }

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  var slice = Array.prototype.slice;

  var domWalk = iterativelyWalk;

  function iterativelyWalk(nodes, cb) {
      if (!('length' in nodes)) {
          nodes = [nodes];
      }
      
      nodes = slice.call(nodes);

      while(nodes.length) {
          var node = nodes.shift(),
              ret = cb(node);

          if (ret) {
              return ret
          }

          if (node.childNodes && node.childNodes.length) {
              nodes = slice.call(node.childNodes).concat(nodes);
          }
      }
  }

  var domComment = Comment;

  function Comment(data, owner) {
      if (!(this instanceof Comment)) {
          return new Comment(data, owner)
      }

      this.data = data;
      this.nodeValue = data;
      this.length = data.length;
      this.ownerDocument = owner || null;
  }

  Comment.prototype.nodeType = 8;
  Comment.prototype.nodeName = "#comment";

  Comment.prototype.toString = function _Comment_toString() {
      return "[object Comment]"
  };

  var domText = DOMText;

  function DOMText(value, owner) {
      if (!(this instanceof DOMText)) {
          return new DOMText(value)
      }

      this.data = value || "";
      this.length = this.data.length;
      this.ownerDocument = owner || null;
  }

  DOMText.prototype.type = "DOMTextNode";
  DOMText.prototype.nodeType = 3;
  DOMText.prototype.nodeName = "#text";

  DOMText.prototype.toString = function _Text_toString() {
      return this.data
  };

  DOMText.prototype.replaceData = function replaceData(index, length, value) {
      var current = this.data;
      var left = current.substring(0, index);
      var right = current.substring(index + length, current.length);
      this.data = left + value + right;
      this.length = this.data.length;
  };

  var dispatchEvent_1 = dispatchEvent;

  function dispatchEvent(ev) {
      var elem = this;
      var type = ev.type;

      if (!ev.target) {
          ev.target = elem;
      }

      if (!elem.listeners) {
          elem.listeners = {};
      }

      var listeners = elem.listeners[type];

      if (listeners) {
          return listeners.forEach(function (listener) {
              ev.currentTarget = elem;
              if (typeof listener === 'function') {
                  listener(ev);
              } else {
                  listener.handleEvent(ev);
              }
          })
      }

      if (elem.parentNode) {
          elem.parentNode.dispatchEvent(ev);
      }
  }

  var addEventListener_1 = addEventListener;

  function addEventListener(type, listener) {
      var elem = this;

      if (!elem.listeners) {
          elem.listeners = {};
      }

      if (!elem.listeners[type]) {
          elem.listeners[type] = [];
      }

      if (elem.listeners[type].indexOf(listener) === -1) {
          elem.listeners[type].push(listener);
      }
  }

  var removeEventListener_1 = removeEventListener;

  function removeEventListener(type, listener) {
      var elem = this;

      if (!elem.listeners) {
          return
      }

      if (!elem.listeners[type]) {
          return
      }

      var list = elem.listeners[type];
      var index = list.indexOf(listener);
      if (index !== -1) {
          list.splice(index, 1);
      }
  }

  var serialize = serializeNode;

  var voidElements = ["area","base","br","col","embed","hr","img","input","keygen","link","menuitem","meta","param","source","track","wbr"];

  function serializeNode(node) {
      switch (node.nodeType) {
          case 3:
              return escapeText(node.data)
          case 8:
              return "<!--" + node.data + "-->"
          default:
              return serializeElement(node)
      }
  }

  function serializeElement(elem) {
      var strings = [];

      var tagname = elem.tagName;

      if (elem.namespaceURI === "http://www.w3.org/1999/xhtml") {
          tagname = tagname.toLowerCase();
      }

      strings.push("<" + tagname + properties(elem) + datasetify(elem));

      if (voidElements.indexOf(tagname) > -1) {
          strings.push(" />");
      } else {
          strings.push(">");

          if (elem.childNodes.length) {
              strings.push.apply(strings, elem.childNodes.map(serializeNode));
          } else if (elem.textContent || elem.innerText) {
              strings.push(escapeText(elem.textContent || elem.innerText));
          } else if (elem.innerHTML) {
              strings.push(elem.innerHTML);
          }

          strings.push("</" + tagname + ">");
      }

      return strings.join("")
  }

  function isProperty(elem, key) {
      var type = typeof elem[key];

      if (key === "style" && Object.keys(elem.style).length > 0) {
        return true
      }

      return elem.hasOwnProperty(key) &&
          (type === "string" || type === "boolean" || type === "number") &&
          key !== "nodeName" && key !== "className" && key !== "tagName" &&
          key !== "textContent" && key !== "innerText" && key !== "namespaceURI" &&  key !== "innerHTML"
  }

  function stylify(styles) {
      if (typeof styles === 'string') return styles
      var attr = "";
      Object.keys(styles).forEach(function (key) {
          var value = styles[key];
          key = key.replace(/[A-Z]/g, function(c) {
              return "-" + c.toLowerCase();
          });
          attr += key + ":" + value + ";";
      });
      return attr
  }

  function datasetify(elem) {
      var ds = elem.dataset;
      var props = [];

      for (var key in ds) {
          props.push({ name: "data-" + key, value: ds[key] });
      }

      return props.length ? stringify(props) : ""
  }

  function stringify(list) {
      var attributes = [];
      list.forEach(function (tuple) {
          var name = tuple.name;
          var value = tuple.value;

          if (name === "style") {
              value = stylify(value);
          }

          attributes.push(name + "=" + "\"" + escapeAttributeValue(value) + "\"");
      });

      return attributes.length ? " " + attributes.join(" ") : ""
  }

  function properties(elem) {
      var props = [];
      for (var key in elem) {
          if (isProperty(elem, key)) {
              props.push({ name: key, value: elem[key] });
          }
      }

      for (var ns in elem._attributes) {
        for (var attribute in elem._attributes[ns]) {
          var prop = elem._attributes[ns][attribute];
          var name = (prop.prefix ? prop.prefix + ":" : "") + attribute;
          props.push({ name: name, value: prop.value });
        }
      }

      if (elem.className) {
          props.push({ name: "class", value: elem.className });
      }

      return props.length ? stringify(props) : ""
  }

  function escapeText(s) {
      var str = '';

      if (typeof(s) === 'string') { 
          str = s; 
      } else if (s) {
          str = s.toString();
      }

      return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
  }

  function escapeAttributeValue(str) {
      return escapeText(str).replace(/"/g, "&quot;")
  }

  var htmlns = "http://www.w3.org/1999/xhtml";

  var domElement = DOMElement;

  function DOMElement(tagName, owner, namespace) {
      if (!(this instanceof DOMElement)) {
          return new DOMElement(tagName)
      }

      var ns = namespace === undefined ? htmlns : (namespace || null);

      this.tagName = ns === htmlns ? String(tagName).toUpperCase() : tagName;
      this.nodeName = this.tagName;
      this.className = "";
      this.dataset = {};
      this.childNodes = [];
      this.parentNode = null;
      this.style = {};
      this.ownerDocument = owner || null;
      this.namespaceURI = ns;
      this._attributes = {};

      if (this.tagName === 'INPUT') {
        this.type = 'text';
      }
  }

  DOMElement.prototype.type = "DOMElement";
  DOMElement.prototype.nodeType = 1;

  DOMElement.prototype.appendChild = function _Element_appendChild(child) {
      if (child.parentNode) {
          child.parentNode.removeChild(child);
      }

      this.childNodes.push(child);
      child.parentNode = this;

      return child
  };

  DOMElement.prototype.replaceChild =
      function _Element_replaceChild(elem, needle) {
          // TODO: Throw NotFoundError if needle.parentNode !== this

          if (elem.parentNode) {
              elem.parentNode.removeChild(elem);
          }

          var index = this.childNodes.indexOf(needle);

          needle.parentNode = null;
          this.childNodes[index] = elem;
          elem.parentNode = this;

          return needle
      };

  DOMElement.prototype.removeChild = function _Element_removeChild(elem) {
      // TODO: Throw NotFoundError if elem.parentNode !== this

      var index = this.childNodes.indexOf(elem);
      this.childNodes.splice(index, 1);

      elem.parentNode = null;
      return elem
  };

  DOMElement.prototype.insertBefore =
      function _Element_insertBefore(elem, needle) {
          // TODO: Throw NotFoundError if referenceElement is a dom node
          // and parentNode !== this

          if (elem.parentNode) {
              elem.parentNode.removeChild(elem);
          }

          var index = needle === null || needle === undefined ?
              -1 :
              this.childNodes.indexOf(needle);

          if (index > -1) {
              this.childNodes.splice(index, 0, elem);
          } else {
              this.childNodes.push(elem);
          }

          elem.parentNode = this;
          return elem
      };

  DOMElement.prototype.setAttributeNS =
      function _Element_setAttributeNS(namespace, name, value) {
          var prefix = null;
          var localName = name;
          var colonPosition = name.indexOf(":");
          if (colonPosition > -1) {
              prefix = name.substr(0, colonPosition);
              localName = name.substr(colonPosition + 1);
          }
          if (this.tagName === 'INPUT' && name === 'type') {
            this.type = value;
          }
          else {
            var attributes = this._attributes[namespace] || (this._attributes[namespace] = {});
            attributes[localName] = {value: value, prefix: prefix};
          }
      };

  DOMElement.prototype.getAttributeNS =
      function _Element_getAttributeNS(namespace, name) {
          var attributes = this._attributes[namespace];
          var value = attributes && attributes[name] && attributes[name].value;
          if (this.tagName === 'INPUT' && name === 'type') {
            return this.type;
          }
          if (typeof value !== "string") {
              return null
          }
          return value
      };

  DOMElement.prototype.removeAttributeNS =
      function _Element_removeAttributeNS(namespace, name) {
          var attributes = this._attributes[namespace];
          if (attributes) {
              delete attributes[name];
          }
      };

  DOMElement.prototype.hasAttributeNS =
      function _Element_hasAttributeNS(namespace, name) {
          var attributes = this._attributes[namespace];
          return !!attributes && name in attributes;
      };

  DOMElement.prototype.setAttribute = function _Element_setAttribute(name, value) {
      return this.setAttributeNS(null, name, value)
  };

  DOMElement.prototype.getAttribute = function _Element_getAttribute(name) {
      return this.getAttributeNS(null, name)
  };

  DOMElement.prototype.removeAttribute = function _Element_removeAttribute(name) {
      return this.removeAttributeNS(null, name)
  };

  DOMElement.prototype.hasAttribute = function _Element_hasAttribute(name) {
      return this.hasAttributeNS(null, name)
  };

  DOMElement.prototype.removeEventListener = removeEventListener_1;
  DOMElement.prototype.addEventListener = addEventListener_1;
  DOMElement.prototype.dispatchEvent = dispatchEvent_1;

  // Un-implemented
  DOMElement.prototype.focus = function _Element_focus() {
      return void 0
  };

  DOMElement.prototype.toString = function _Element_toString() {
      return serialize(this)
  };

  DOMElement.prototype.getElementsByClassName = function _Element_getElementsByClassName(classNames) {
      var classes = classNames.split(" ");
      var elems = [];

      domWalk(this, function (node) {
          if (node.nodeType === 1) {
              var nodeClassName = node.className || "";
              var nodeClasses = nodeClassName.split(" ");

              if (classes.every(function (item) {
                  return nodeClasses.indexOf(item) !== -1
              })) {
                  elems.push(node);
              }
          }
      });

      return elems
  };

  DOMElement.prototype.getElementsByTagName = function _Element_getElementsByTagName(tagName) {
      tagName = tagName.toLowerCase();
      var elems = [];

      domWalk(this.childNodes, function (node) {
          if (node.nodeType === 1 && (tagName === '*' || node.tagName.toLowerCase() === tagName)) {
              elems.push(node);
          }
      });

      return elems
  };

  DOMElement.prototype.contains = function _Element_contains(element) {
      return domWalk(this, function (node) {
          return element === node
      }) || false
  };

  var domFragment = DocumentFragment;

  function DocumentFragment(owner) {
      if (!(this instanceof DocumentFragment)) {
          return new DocumentFragment()
      }

      this.childNodes = [];
      this.parentNode = null;
      this.ownerDocument = owner || null;
  }

  DocumentFragment.prototype.type = "DocumentFragment";
  DocumentFragment.prototype.nodeType = 11;
  DocumentFragment.prototype.nodeName = "#document-fragment";

  DocumentFragment.prototype.appendChild  = domElement.prototype.appendChild;
  DocumentFragment.prototype.replaceChild = domElement.prototype.replaceChild;
  DocumentFragment.prototype.removeChild  = domElement.prototype.removeChild;

  DocumentFragment.prototype.toString =
      function _DocumentFragment_toString() {
          return this.childNodes.map(function (node) {
              return String(node)
          }).join("")
      };

  var event = Event;

  function Event(family) {}

  Event.prototype.initEvent = function _Event_initEvent(type, bubbles, cancelable) {
      this.type = type;
      this.bubbles = bubbles;
      this.cancelable = cancelable;
  };

  Event.prototype.preventDefault = function _Event_preventDefault() {
      
  };

  var document$1 = Document;

  function Document() {
      if (!(this instanceof Document)) {
          return new Document();
      }

      this.head = this.createElement("head");
      this.body = this.createElement("body");
      this.documentElement = this.createElement("html");
      this.documentElement.appendChild(this.head);
      this.documentElement.appendChild(this.body);
      this.childNodes = [this.documentElement];
      this.nodeType = 9;
  }

  var proto = Document.prototype;
  proto.createTextNode = function createTextNode(value) {
      return new domText(value, this)
  };

  proto.createElementNS = function createElementNS(namespace, tagName) {
      var ns = namespace === null ? null : String(namespace);
      return new domElement(tagName, this, ns)
  };

  proto.createElement = function createElement(tagName) {
      return new domElement(tagName, this)
  };

  proto.createDocumentFragment = function createDocumentFragment() {
      return new domFragment(this)
  };

  proto.createEvent = function createEvent(family) {
      return new event(family)
  };

  proto.createComment = function createComment(data) {
      return new domComment(data, this)
  };

  proto.getElementById = function getElementById(id) {
      id = String(id);

      var result = domWalk(this.childNodes, function (node) {
          if (String(node.id) === id) {
              return node
          }
      });

      return result || null
  };

  proto.getElementsByClassName = domElement.prototype.getElementsByClassName;
  proto.getElementsByTagName = domElement.prototype.getElementsByTagName;
  proto.contains = domElement.prototype.contains;

  proto.removeEventListener = removeEventListener_1;
  proto.addEventListener = addEventListener_1;
  proto.dispatchEvent = dispatchEvent_1;

  var minDocument = new document$1();

  var topLevel = typeof commonjsGlobal !== 'undefined' ? commonjsGlobal :
      typeof window !== 'undefined' ? window : {};


  var doccy;

  if (typeof document !== 'undefined') {
      doccy = document;
  } else {
      doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

      if (!doccy) {
          doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDocument;
      }
  }

  var document_1 = doccy;

  var isObject = function isObject(x) {
  	return typeof x === "object" && x !== null;
  };

  function applyProperties(node, props, previous) {
    for (var propName in props) {
      var propValue = props[propName];
      if (propValue === undefined) {
        removeProperty(node, propName, propValue, previous);
      } else {
        if (isObject(propValue)) {
          patchObject(node, props, previous, propName, propValue);
        } else {
          node[propName] = propValue;
        }
      }
    }  
  }
  function removeProperty(node, propName, propValue, previous) {
    if (previous) {
      var previousValue = previous[propName];
      if (propName === "attributes") {
        for (var attrName in previousValue) {
          node.removeAttribute(attrName);
        }
      } else if (propName === "style") {
        for (var i in previousValue) {
          node.style[i] = "";
        }
      } else if (typeof previousValue === "string") {
        node[propName] = "";
      } else {
        node[propName] = null;
      }
    }
  }
  function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined;

    if (propName === "attributes") {
      for (var attrName in propValue) {
        var attrValue = propValue[attrName];
        if (attrValue === undefined) {
          node.removeAttribute(attrName);
        } else {
          node.setAttribute(attrName, attrValue);
        }
      }
      return
    }
    if (previousValue && isObject(previousValue) && getPrototype(previousValue) !== getPrototype(propValue)) {
      node[propName] = propValue;
      return
    }
    if (!isObject(node[propName])) {
      node[propName] = {};
    }
    var replacer = propName === "style" ? "" : undefined;

    for (var k in propValue) {
      var value = propValue[k];
      node[propName][k] = (value === undefined) ? replacer : value;
    }
  }

  function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
  }

  // 真实DOM

  function createElement(vnode) {
    if (isVText$1(vnode)) {
      return document_1.createTextNode(vnode.text)
    }
    var node = document_1.createElement(vnode.tagName);
    var props = vnode.properties;
    applyProperties(node, props);
    var children = vnode.children;
    for (let i = 0; i < children.length; i++) {
      var childNode = createElement(children[i]);
      if (childNode) {
        node.appendChild(childNode);
      }
    }
    return node 
  }

  class VirtualPatch{
    constructor(type, vNode, patch) {
      this.type = Number(type);
      this.vNode = vNode;
      this.patch = patch;
    }
  }
  VirtualPatch.prototype.type = "VirtualPatch";
  VirtualPatch.NONE = 0;
  VirtualPatch.VTEXT = 1;
  VirtualPatch.VNODE = 2;
  VirtualPatch.WIDGET = 3;
  VirtualPatch.PROPS = 4;
  VirtualPatch.ORDER = 5;
  VirtualPatch.INSERT = 6;
  VirtualPatch.REMOVE = 7; 
  VirtualPatch.THUNK = 8;

  // diff函数，对比两棵树
  function diff(a, b) {
    var patch = { a: a };
    walk(a, b, patch, 0);
    return patch
  }
  // 对两棵树深度优先遍历
  function walk(a, b, patch, index) {
    if (a === b) {
      return
    }
    var apply = patch[index];

    if (b == null) {
      apply = appendPatch(apply, new VirtualPatch(VirtualPatch.REMOVE, a, b));
    } else if (isVNode(b)) {
      if (isVNode(a)) {
        if (a.tagName === b.tagName) {
          var propsPatch = diffProps(a.properties, b.properties);
          if (propsPatch) {
            apply = appendPatch(apply, new VirtualPatch(VirtualPatch.PROPS, a, propsPatch));
          }
        }
        apply = diffChildren(a, b, patch, apply, index);
      } else {
        apply = appendPatch(apply, new VirtualPatch(VirtualPatch.VNODE, a, b));
      }
    } else if (isVText(b)) {
      if (!isVText(a)) {
        apply = appendPatch(apply, new VirtualPatch(VirtualPatch.VTEXT, a, b));
      } else if (a.text !== b.text) {
        apply = appendPatch(apply, new VirtualPatch(VirtualPatch.VTEXT, a, b));
      }
    }


    if (apply) {
      patch[index] = apply;
    }
  }
  function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children;
    var orderedSet = reorder(aChildren, b.children);
    var bChildren = orderedSet.children;

    var aLen = aChildren.length;
    var bLen = bChildren.length;
    var len = aLen > bLen ? aLen : bLen;

    for(var i = 0; i < len; i++) {
      var leftNode = aChildren[i];
      var rightNode = bChildren[i];
      index += 1;

      if (!leftNode) {
        if (rightNode) {
          apply = appendPatch(apply, new VirtualPatch(VirtualPatch.INSERT, null, rightNode));
        }
      } else {
        walk(leftNode, rightNode, patch, index);
      }
      if (isVNode(leftNode) && leftNode.count) {
        index += leftNode.count;
      }
    }
    return apply
  }


  function reorder(aChildren, bChildren) {
    
  }
  function appendPatch(apply, VPatch) {
    if (apply) {
      if (isArray(apply)) {
        apply.push(VPatch);
      } else {
        apply = [apply, VPatch];
      }
      return apply
    } else {
      return VPatch
    }
  }

  exports.diff = diff;
  exports.h = h;
  exports.createElement = createElement;

  return exports;

}({}));
//# sourceMappingURL=bundle.js.map
