// 虚拟文本节点
export default class VText {
  constructor(text) {
    this.text = String(text)
  }
  type() {
    return "VirtualText"
  }
}
VText.prototype.type = 'VirtualText'
