const RENDER_TO_DOM = Symbol('render to dom')
export function createElement(type, attributes, ...children) {
  let dom
  if (typeof type === 'string') {
    dom = new ElementWrapper(type)
  } else {
    dom = new type
  }
  for (let p in attributes) {
    dom.setAttribute(p, attributes[p])
  }
  let insertChildren = (children) => {
    for (let child of children) {
      if (typeof child === 'string') {
        child = new TextWrapper(child)
      } 
      if (child === null) {
        continue
      }
      if (typeof child === 'object' && child instanceof Array ) {
        insertChildren(child)
      } else {
        dom.appendChild(child)
      }
    }
  }
  insertChildren(children)
  
  return dom
}
function replaceContent(range, node) {
  range.insertNode(node)
  range.setStartAfter(node)
  range.deleteContents()
  range.setStartBefore(node)
  range.setEndAfter(node)
}
export class Component {
  constructor(type) {
    this.type = type
    this.props = Object.create(null)
    this.children = []
    this._range = null
  }
  setAttribute(name , value) {
    this.props[name] = value
  }
  appendChild(component) {
    this.children.push(component)
  }
  get vdom() {
    return this.render().vdom
  }

  [RENDER_TO_DOM](range) {
    this._range = range
    this._vdom = this.vdom
    this._vdom[RENDER_TO_DOM](range)
  }
  // rerender() {
  //   // this._range.deleteContents()  //range为空时会被旁边的range吞并
  //   // this[RENDER_TO_DOM](this._range)
  //   const oldRange = this._range
  //   let range = document.createRange()
  //   range.setStart(oldRange.startContainer, oldRange.startOffset)
  //   range.setEnd(oldRange.startContainer, oldRange.startOffset)
  //   this[RENDER_TO_DOM](range)

  //   oldRange.setStart(range.endContainer, range.endOffset)
  //   oldRange.deleteContents()
  // }
  
  update() {
    let isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) 
        return false
      if (Object.keys(oldNode.props).length !== Object.keys(newNode.props).length) 
        return false
      for (let name in newNode.props) {
        if (oldNode.props[name] !== newNode.props[name]) 
          return false
      }
      if (newNode.type === '#text') {
        return oldNode.content === newNode.content
      }
      return true
    }
    let update = (oldNode, newNode) => {
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range)
        return
      }
      newNode._range = oldNode._range


      const newChildren = newNode.vChildren
      const oldChildren = oldNode.vChildren

      if (!newChildren || !newChildren.length) return
      let trailRange = oldChildren[oldChildren.length - 1]._range

      for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i]
        const oldChild = oldChildren[i]
        if (i < oldChildren.length) {
          update(oldChild, newChild)
        } else {
          let range = document.createRange()
          range.setStart(trailRange.endContainer, trailRange.endOffset)
          range.setEnd(trailRange.endContainer, trailRange.endOffset)
          newChild[RENDER_TO_DOM](range)
          trailRange = range
        }
      }
    }
    let vdom = this.vdom
    update(this._vdom, vdom)
    this._vdom = vdom
  }
  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState
      this.update()
      return
    }

    let mergeState = (oldState, newState) => {
      for (let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== 'object') {
          oldState[p] = newState[p]
        } else {
          // 递归深拷贝
          mergeState(oldState[p], newState[p])
        }
      }
    }
    mergeState(this.state, newState)
    this.update()
  }
}

export class ElementWrapper extends Component{
  constructor(type) {
    super(type)
  }

  get vdom() {
    this.vChildren = this.children.map(child => child.vdom)
    return this
  }

  [RENDER_TO_DOM](range) {
    this._range = range

    const root = document.createElement(this.type)
    // setAttributes
    for (let name in this.props) {
      const value = this.props[name]
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
      } else {
        if (name === 'className') {
          root.setAttribute('class', value)
        } else {
          root.setAttribute(name, value)
        }
      }
    }
    // appendChild
    if (!this.vChildren) {
      this.vChildren = this.children.map((child) => child.vdom)
    }
    for (let child of this.vChildren) {
      let childRange = document.createRange()
      childRange.setStart(root, root.childNodes.length)
      childRange.setEnd(root, root.childNodes.length)
      child[RENDER_TO_DOM](childRange)
    }
    replaceContent(range, root)
  }
}

export class TextWrapper extends Component{
  constructor(content) {
    super('#text')
    this.content = content
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    const root = document.createTextNode(this.content)
    replaceContent(range, root)
  }
  get vdom() {
    return this
  }
}


export function render(component, parentElement) {
  let range = document.createRange()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length)
  range.deleteContents()
  component[RENDER_TO_DOM](range)
}