import Element from '../lib/element'

describe('element', () => {
  test('element should has tagName porps and children', () => {
    var el = new Element()
    expect(el.__proto__.hasOwnProperty('render')).toBeTruthy()
  })
})