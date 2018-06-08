// 创建虚拟节点，为了构建虚拟DOM树，其实对VNode的封装,增加其灵活性
// import isArray from 'x-is-array'
import VNode from './vnode'
import VText from './vtext'
// import parseTag from './parse-tag'
import { isVText, isVNode } from './util'
export default function h(tagName, properties, children) {
  var childNodes = []
  var tag, props

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
    childNodes.push(new VText(children))
  } else if (typeof children === 'number') {
    childNodes.push(new VText(String(children)))
  } else if (isChild(children)) {
    childNodes.push(children);
  } else if (isArray(children)) {
    children.forEach(child => {
      addChild(child, childNodes)
    })
  } else {
    return
  }
}
function isChild(x) {
  return isVNode(x) || isVText(x);
}

function isChildren(x) {
  return typeof x === 'string' || isArray(x) || isChild(x);
}
function isArray(x) {
  return Array.isArray(x)
}
