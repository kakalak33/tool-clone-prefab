// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({
  // css style for panel
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
    #btn { margin-top: 20px; }
  `,

  // html template for panel
  template: `
    <h2>Clear Assets</h2>
    <hr />
    <div><span id="label">Import Scene file</span></div>
    <hr />
    <ui-asset value="" id="asset"></ui-asset>
    <hr />
    <h3>Are you sure?</h3>
    <div>
      <image src="/Users/fe-tienhuynh/Documents/demo-extensions/packages/eno-extensions/images/sure.png" width="300" height="200" />
    </div>
    <ui-button id="btn">Clear</ui-button>
  `,

  // element and variable binding
  $: {
    btn: '#btn',
    label: '#label',
    asset: '#asset',
  },

  // method executed when template and styles are successfully loaded and initialized
  ready () {
    this.$btn.addEventListener('confirm', () => {
      Editor.Ipc.sendToMain('eno-extensions:clear', this.$asset.value);
    });
  },

  // register your ipc messages here
  messages: {}
});