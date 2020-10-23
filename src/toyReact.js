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

export class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type)
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value)
  }
  appendChild(component) {
    this.root.appendChild(component.root)
  }
}

export class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
  }
}

export class Component {
  constructor() {
    this._root = null
    this.props = Object.create(null)
    this.children = []
  }
  setAttribute(name , value) {
    this.props[name] = value
  }
  appendChild(component) {
    this.children.push(component)
  }
  get root() {
    if (!this._root) {
      this._root = this.render().root
    }
    return this._root
  }
}


export function render(component, parentElement) {
  parentElement.appendChild(component.root)
}