import { isArray } from './util'
import VNode from './vnode'
import VText from './vtext'
import VPatch from './vpatch'

// diff函数，对比两棵树
export default function diff(a, b) {
  var patch = { a: a }
  walk(a, b, patch, 0)
  return patch
}
// 对两棵树深度优先遍历
function walk(a, b, patch, index) {
  if (a === b) {
    return
  }
  var apply = patch[index]
  var applyClear = false

  if (b == null) {
    apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
  } else if (isVNode(b)) {
    if (isVNode(a)) {
      if (a.tagName === b.tagName) {
        var propsPatch = diffProps(a.properties, b.properties)
        if (propsPatch) {
          apply = appendPatch(apply, new VPatch(VPatch.PROPS, a, propsPatch))
        }
      }
      apply = diffChildren(a, b, patch, apply, index)
    } else {
      apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
      applyClear = true
    }
  } else if (isVText(b)) {
    if (!isVText(a)) {
      apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
      applyClear = true
    } else if (a.text !== b.text) {
      apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
    }
  }


  if (apply) {
    patch[index] = apply
  }
}
function diffChildren(a, b, patch, apply, index) {
  var aChildren = a.children
  var orderedSet = reorder(aChildren, b.children)
  var bChildren = orderedSet.children

  var aLen = aChildren.length
  var bLen = bChildren.length
  var len = aLen > bLen ? aLen : bLen

  for(var i = 0; i < len; i++) {
    var leftNode = aChildren[i]
    var rightNode = bChildren[i]
    index += 1

    if (!leftNode) {
      if (rightNode) {
        apply = appendPatch(apply, new VPatch(VPatch.INSERT, null, rightNode))
      }
    } else {
      walk(leftNode, rightNode, patch, index)
    }
    if (isVNode(leftNode) && leftNode.count) {
      index += leftNode.count
    }
  }
  return apply
}


function reorder(aChildren, bChildren) {
  
}
function appendPatch(apply, VPatch) {
  if (apply) {
    if (isArray(apply)) {
      apply.push(VPatch)
    } else {
      apply = [apply, VPatch]
    }
    return apply
  } else {
    return VPatch
  }
}
