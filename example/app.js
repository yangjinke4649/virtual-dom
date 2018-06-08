var h = VirtualDom.h
var createElement = VirtualDom.createElement
var diff = VirtualDom.diff
var oldNode = h('div', { 
            style: {
              color: 'red'
            }
          }, [
            'qqqq',
            h('p', [
              h('span', 'www')
          ])
])
var patchs = diff(oldNode, newNode)
console.log(patchs)

// var rootNode =  createElement(res) 
// document.body.appendChild(rootNode)     
