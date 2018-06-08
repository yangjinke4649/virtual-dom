// 真实DOM
import document from 'global/document'
import { isVText, isVNode } from './util'
import { applyProperties } from './apply-properties'

export function createElement(vnode) {
  if (isVText(vnode)) {
    return document.createTextNode(vnode.text)
  }
  var node = document.createElement(vnode.tagName)
  var props = vnode.properties
  applyProperties(node, props)
  var children = vnode.children
  for (let i = 0; i < children.length; i++) {
    var childNode = createElement(children[i])
    if (childNode) {
      node.appendChild(childNode)
    }
  }
  return node 
}