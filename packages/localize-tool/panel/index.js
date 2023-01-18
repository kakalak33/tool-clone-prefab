// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({
  // css style for panel
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
    .dragBox { width:200px; position: relative; left: 125px }
  `,

  // html template for panel
  template: `
    <h2>localize-tool</h2>
    <hr />
    <div>Folder</div>
    <ui-asset id="folderAsset" class="dragBox" type="folder" droppable="asset" tabindex="-1" empty=""></ui-asset>
    <hr />
    <div>Target Component</div>
    <ui-asset value="" class="dragBox"id="script"></ui-asset>
    <hr /> 
    <ui-button id="btnStart">Remove Component</ui-button>
    <ui-button id="btnLog">Log</ui-button>
  `,

  // element and variable binding
  $: {
    btnStart: '#btnStart',
    btnLog: '#btnLog',
    folderAsset: '#folderAsset',
    script: '#script'
  },

  // method executed when template and styles are successfully loaded and initialized
  ready() {
    this.$btnStart.addEventListener('confirm', () => {
      const compressedUuid = Editor.Utils.UuidUtils.compressUuid(this.$script.value);
      Editor.Ipc.sendToMain('localize-tool:clicked', this.$folderAsset.value, compressedUuid);
    });
    this.$btnLog.addEventListener('confirm', () => {

    });
  },

  // register your ipc messages here
  messages: {
    'localize-tool:hello'(event) {
      // this.$label.innerText = 'Hello!';
    }
  }
});