// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({
  // css style for panel
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
    .dragBox { width:200px; position: relative; left: 50px }
  `,

  // html template for panel
  template: `
    <h2>localize-tool</h2>
    <hr />
    <div>Scene</div>
    <ui-asset value="" class="dragBox"id="scene"></ui-asset>
    <hr />
    <div>Script</div>
    <ui-asset value="" class="dragBox"id="script"></ui-asset>
    <hr />
    <ui-button id="btn">Localize</ui-button>
  `,

  // element and variable binding
  $: {
    btn: '#btn',
    scene: '#scene',
    script: '#script'
  },

  // method executed when template and styles are successfully loaded and initialized
  ready() {
    this.$btn.addEventListener('confirm', () => {
      const uuid = this.$scene.value;
      const compressedUuid = Editor.Utils.UuidUtils.compressUuid(this.$script.value);
      Editor.assetdb.queryPathByUuid(uuid, (err, results) => {
        Editor.Ipc.sendToMain('localize-tool:clicked', results, compressedUuid);
      });
    });
  },

  // register your ipc messages here
  messages: {
    'localize-tool:hello'(event) {
      // this.$label.innerText = 'Hello!';
    }
  }
});