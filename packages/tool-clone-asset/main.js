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
    const newUUID = getDecompressUuid();
    const destMetaFilePath = destPath + '.meta';
    const oldUUID = Editor.assetdb.fspathToUuid(currentPath);
    const fileName = path.basename(currentPath).split('.')[0];
    const fileType = path.basename(currentPath).split('.')[1];
    return {
        destPath,
        destMetaFilePath,
        contentObject,
        newUUID,
        oldUUID,
        fileName,
        fileType,
    };
}

function getDecompressUuid() {
    return Editor.Utils.UuidUtils.decompressUuid(Editor.Utils.UuidUtils.uuid());
}

function compressUuid(uuid) {
    return Editor.Utils.UuidUtils.compressUuid(uuid);
}

function cloneAssets() {
    let listFolders = [];
    let listAssets = [];
    let sceneAssets = [];
    let otherAssets = [];
    let folderPath = Editor.assetdb.uuidToFspath('6412f35b-29d1-4ebe-b90a-53ff0355c072');
    walkSync(folderPath, function(filePath, isDirectory) {
        if (isDirectory) {
            listFolders.push(filePath);
        } else {
            listAssets.push(filePath);
        }
    });

    // clone empty folder and meta file
    for (let index = 0; index < listFolders.length; index++) {
        const currentPath = listFolders[index];
        let { destPath, destMetaFilePath, contentObject, newUUID } = getAssetInfo(currentPath);

        contentObject.uuid = newUUID;
        fs.mkdirSync(destPath);
        fs.writeFileSync(destMetaFilePath, JSON.stringify(contentObject));
    }

    // clone file and meta file
    for (let index = 0; index < listAssets.length; index++) {
        const currentPath = listAssets[index];
        let { destPath, destMetaFilePath, contentObject, newUUID, oldUUID, fileName, fileType } = getAssetInfo(currentPath);
        const fileContent = fs.readFileSync(currentPath);

        const subMetasUUID = getDecompressUuid();
        const newTextureUuid = getDecompressUuid();
        let oldSubMetaUUID;

        // change path to avoid duplicate class name
        if (fileType === 'js') {
            destPath = destPath.split(fileName).join(fileName + '1');
            destMetaFilePath = destMetaFilePath.split(fileName).join(fileName + '1');
        }

        // change uuid
        if (contentObject.uuid) {
            contentObject.uuid = newUUID;
        }
        // change texture uuid
        if (contentObject.textureUuid && contentObject.textureUuid.length) {
            oldTextureUuid = contentObject.textureUuid;
            contentObject.textureUuid = newTextureUuid;
        }

        // change uuid for spriteFrame
        if (contentObject.subMetas && contentObject.subMetas[fileName]) {
            if (contentObject.subMetas[fileName].uuid) {
                oldSubMetaUUID = contentObject.subMetas[fileName].uuid;
                contentObject.subMetas[fileName].uuid = subMetasUUID;
            }
            if (contentObject.subMetas[fileName].rawTextureUuid) {
                contentObject.subMetas[fileName].rawTextureUuid = newUUID;
            }
        }
        
        fs.writeFileSync(destPath, fileContent);
        fs.writeFileSync(destMetaFilePath, JSON.stringify(contentObject));

        const assetData = { fileType, fileName, destPath, newUUID, oldUUID, subMetasUUID, oldSubMetaUUID };
        if (fileType === 'fire' || fileType === 'prefab') {
            sceneAssets.push(assetData);
        } else {
            otherAssets.push(assetData);
        }
    }

    // update font with new texture
    otherAssets.forEach(assetInfo => {
        const { fileType, fileName, destPath } = assetInfo;
        if (fileType === 'fnt') {
            const fontPath = destPath + '.meta';
            const fontImagePath = fontPath.split('fnt').join('png');
            let fontObject = JSON.parse(fs.readFileSync(fontPath).toString());
            let fontImageObject = JSON.parse(fs.readFileSync(fontImagePath).toString());
            if (fontObject.textureUuid && fontImageObject.subMetas && fontImageObject.subMetas[fileName]) {
                const { rawTextureUuid } = fontImageObject.subMetas[fileName];
                fontObject.textureUuid = rawTextureUuid;
                fs.writeFileSync(fontPath, JSON.stringify(fontObject));
            }
        }
    });

    // replace uuid and update new scene
    sceneAssets.forEach(sceneInfo => {
        let sceneString = fs.readFileSync(sceneInfo.destPath).toString();
        otherAssets.forEach(assetInfo => {
            const { newUUID, oldUUID, subMetasUUID, oldSubMetaUUID } = assetInfo;
            const oldCompressUUID = compressUuid(oldUUID);
            const newCompressUUID = compressUuid(newUUID);
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
            cloneAssets();
        }
    },
};