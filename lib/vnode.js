// 构建虚拟节点
import { isVNode } from './util'
export default class VNode {
  constructor(tagName, properties, children) {
    this.tagName = tagName
    this.properties = properties || {}
    this.children = children || []

    var count = (children && children.length) || 0
    var descendants = 0

    this.children.forEach(child => {
      if(isVNode(child)) {
        descendants += child.count || 0
      }
    })
    this.count = count + descendants // 所有子虚拟节点的数量
  }
}
VNode.prototype.type = 'VirtualNode'
