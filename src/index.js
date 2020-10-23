import {createElement, Component, render} from './toyReact'
class MyComponent extends Component{
  render() {
    return <div>
      <span>I'm a component</span>
      {this.children}
    </div>
  }
}
const template = <div class="wrapper" data="abc">
  <MyComponent data="component-data">
    <div> I'm child of a component</div>
  </MyComponent>
  <h1 class="title">I'm a title</h1>
  I'm a paragraph
</div>

render(template, document.querySelector('body'))