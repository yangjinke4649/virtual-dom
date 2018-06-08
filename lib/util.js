export function setAttr(node, key, value) {
  switch (key) {
    case 'style': 
      node.style.cssText = value
      break
    case 'value':
      var tagName = node.tagName || ''
      tageName = tagName.toLowerCase()
      if (tagName === 'input' || tagName === 'textarea') {
        node.value = value
      } else {
        node.setAttribute(key, value)
      }
      break
    default:
      node.setAttribute(key, value)
      break  
  }
} 
export function isVNode(x) {
  return x && x.type === "VirtualNode"
}
export function isVText(x) {
  return x && x.type === "VirtualText"
}
export function isArray(x) {
  return Array.isArray(x)
}