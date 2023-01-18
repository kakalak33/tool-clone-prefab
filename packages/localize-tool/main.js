'use strict';


function readScene(path) {
  const { readFileSync } = require('fs');
  const sceneString = readFileSync(path, { encoding: 'UTF-8' })
  return JSON.parse(sceneString);
}

module.exports = {

  messages: {
    'open'() {
      // open entry panel registered in package.json
      Editor.Panel.open('localize-tool');
    },
    'clicked'(evt, scenePath, compressedUuid) {
      Editor.log('Tool run')
      let sceneArr = readScene(scenePath);
      let assetdbRootPath = 'db://assets';
      const { writeFileSync } = require('fs')

      // get all nodes having this script
      const scriptedNodes = [];
      sceneArr.forEach(sceneInfo => {
        if (sceneInfo.__type__ == compressedUuid) {
          scriptedNodes.push(sceneArr[sceneInfo.node.__id__]);
        }
      })

      // if node have sprite comp => set spriteFrame null
      scriptedNodes.forEach(nodeInfo => {
        if (nodeInfo) {
          const { _components } = nodeInfo;
          if (_components) {
            _components.forEach(({ __id__ }) => {
              if (sceneArr[__id__].__type__ == 'cc.Sprite') {
                sceneArr[__id__]._spriteFrame = null;
              }
            })
          }
        }
      })

      // overwrite scene file and refresh db
      writeFileSync(scenePath, JSON.stringify(sceneArr))
      Editor.assetdb.refresh(assetdbRootPath, () => Editor.log('Refresh database'));
      Editor.log('Localization succeeds');
    },
  },
};