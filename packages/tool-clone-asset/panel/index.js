// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({
    // css style for panel
    style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
    `,

    // html template for panel
    template: `
    <h2>tool-clone-asset</h2>
    <hr />
    <ui-asset value="" class="asset"></ui-asset>
    <hr />
    <ui-button id="btn">Send To Main</ui-button>
    <ui-button id="btnRefresh">Refresh Assets Dir</ui-button>
    `,

    // element and variable binding
    $: {
        btn: '#btn',
        btnRefresh: '#btnRefresh',
        asset: '.asset',
    },

    // method executed when template and styles are successfully loaded and initialized
    ready() {
        this.$btn.addEventListener('confirm', () => {
            Editor.Ipc.sendToMain('tool-clone-asset:clicked', this.$asset.value);
        });
        this.$btnRefresh.addEventListener('confirm', () => {
            Editor.Ipc.sendToMain('tool-clone-asset:refresh');
        });
    },

    // register your ipc messages here
    messages: {
        // 'tool-clone-asset:hello' (event) {
        //     this.$label.innerText = 'Hello!';
        // }
    }
});