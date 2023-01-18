'use strict';
const PanelManager = require('./panelManager');

module.exports = {
  load () {
    // execute when package loaded
  },

  unload () {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'open-clone-game' () {
      PanelManager.openCloneGamePanel();
    },
    'open-clear-asset' () {
      PanelManager.openClearAssetPanel();
    },
    'say-hello' () {
      Editor.log('Hello World!');
      // send ipc message to panel
      Editor.Ipc.sendToPanel('eno-extensions', 'eno-extensions:hello');
    },
    'clear' (evt, sceneUuid) {
      PanelManager.clearAssets(sceneUuid);
    }
  },
};