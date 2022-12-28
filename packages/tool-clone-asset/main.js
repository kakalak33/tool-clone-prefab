const fs = require('fs');
const path = require('path');
'use strict';

let currentRootPath = 'demo-prefab';
let destRootPath = 'demo-clone';
function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        let filePath = path.join(currentDirPath, name);
        let stat = fs.statSync(filePath);
        if (!filePath.includes('.DS_Store') && !filePath.includes('.meta')) {
            if (stat.isFile()) {
                callback(filePath, false);
            } else if (stat.isDirectory()) {
                callback(filePath, true);
                walkSync(filePath, callback);
            }
        }
    });
}

function getAssetInfo(currentPath) {
    const destPath = currentPath.replace(currentRootPath, destRootPath);
    const currentMetaFilePath = currentPath + '.meta';
    const content = fs.readFileSync(currentMetaFilePath).toString();
    const contentObject = JSON.parse(content);
    const newUUID = Editor.Utils.UuidUtils.decompressUuid(Editor.Utils.UuidUtils.uuid());
    const destMetaFilePath = destPath + '.meta';
    const oldUUID = Editor.assetdb.fspathToUuid(currentPath);
    return {
        destPath,
        destMetaFilePath,
        contentObject,
        newUUID,
        oldUUID
    };
}

module.exports = {
  load () {
    // execute when package loaded
  },

  unload () {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'open' () {
        // open entry panel registered in package.json
        Editor.Panel.open('tool-clone-asset');
    },
    'say-hello' () {
        Editor.log('Hello World!', );
        // send ipc message to panel
        Editor.Ipc.sendToPanel('tool-clone-asset', 'tool-clone-asset:hello');
    },
    'clicked' (evt, uuid) {
        let folderPath = Editor.assetdb.uuidToFspath('6412f35b-29d1-4ebe-b90a-53ff0355c072');
        let listFolders = [];
        let listAssets = [];
        walkSync(folderPath, function(filePath, isDirectory) {
            if (isDirectory) {
                listFolders.push(filePath);
            } else {
                listAssets.push(filePath);
            }
        });

        // create folder and meta folder
        for (let index = 0; index < listFolders.length; index++) {
            const currentPath = listFolders[index];
            const { destPath, destMetaFilePath, contentObject, newUUID } = getAssetInfo(currentPath);

            contentObject.uuid = newUUID;
            fs.mkdirSync(destPath);
            fs.writeFileSync(destMetaFilePath, JSON.stringify(contentObject));
        }

        let sceneAssets = [];
        let otherAssets = [];
        // create file and meta file
        for (let index = 0; index < listAssets.length; index++) {
            const currentPath = listAssets[index];
            let { destPath, destMetaFilePath, contentObject, newUUID, oldUUID } = getAssetInfo(currentPath);
            const fileContent = fs.readFileSync(currentPath);

            const fileName = path.basename(currentPath).split('.')[0];
            let fileType = path.basename(currentPath).split('.')[1];

            if (fileType === 'js') {
                destPath = destPath.split(fileName).join(fileName + '1');
            }
            fs.writeFileSync(destPath, fileContent);
            const subMetasUUID = Editor.Utils.UuidUtils.decompressUuid(Editor.Utils.UuidUtils.uuid());
            let oldSubMetaUUID = '';
            if (contentObject.uuid) {
                contentObject.uuid = newUUID;
            }
            if (contentObject.subMetas && contentObject.subMetas[fileName]) {
                if (contentObject.subMetas[fileName].uuid) {
                    oldSubMetaUUID = contentObject.subMetas[fileName].uuid;
                    contentObject.subMetas[fileName].uuid = subMetasUUID;
                }
                if (contentObject.subMetas[fileName].rawTextureUuid) {
                    contentObject.subMetas[fileName].rawTextureUuid = newUUID;
                }
            }
            if (fileType === 'js') {
                destMetaFilePath = destMetaFilePath.split(fileName).join(fileName + '1');
            }
            fs.writeFileSync(destMetaFilePath, JSON.stringify(contentObject));

            if (fileType === 'fire') {
                sceneAssets.push({ fileType, destPath, newUUID, subMetasUUID, oldUUID })
            } else {
                otherAssets.push({ fileType, destPath, newUUID, subMetasUUID, oldSubMetaUUID, oldUUID })
            }
        }

        sceneAssets.forEach(sceneInfo => {
            let sceneString = fs.readFileSync(sceneInfo.destPath).toString();
            otherAssets.forEach(assetInfo => {
                Editor.log(assetInfo);
                const { newUUID, oldUUID, oldSubMetaUUID, subMetasUUID } = assetInfo;
                const oldCompressUUID = Editor.Utils.UuidUtils.compressUuid(oldUUID);
                const newCompressUUID = Editor.Utils.UuidUtils.compressUuid(newUUID);
                sceneString = sceneString.split(oldUUID).join(newUUID);
                sceneString = sceneString.split(oldCompressUUID).join(newCompressUUID);
                // only for spriteFrame
                if (oldSubMetaUUID) {
                    sceneString = sceneString.split(oldSubMetaUUID).join(subMetasUUID);
                }
            });
            fs.writeFileSync(sceneInfo.destPath, sceneString);
        });

        const url = Editor.assetdb.uuidToUrl('69fd8e0b-5436-4830-b746-f400dc3858fd');

        Editor.assetdb.refresh(url, () => {
            Editor.log('Refresh Folder');
        });
    }
  },
};