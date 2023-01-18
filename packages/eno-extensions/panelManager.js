const { BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

function calcWindowPosition(size, anchor) {
    const editorWin = BrowserWindow.getFocusedWindow(),
        editorSize = editorWin.getSize(),
        editorPos = editorWin.getPosition();
    const x = Math.floor(editorPos[0] + (editorSize[0] / 2) - (size[0] / 2));
    let y;
    switch (anchor || 'top') {
        case 'top': {
            y = Math.floor(editorPos[1]);
            break;
        }
        case 'center': {
            y = Math.floor(editorPos[1] + (editorSize[1] / 2) - (size[1] / 2));
            break;
        }
    }
    return [x, y];
}

function getDecompressUuid() {
    return Editor.Utils.UuidUtils.decompressUuid(Editor.Utils.UuidUtils.uuid());
}

function compressUuid(uuid) {
    return Editor.Utils.UuidUtils.compressUuid(uuid);
}

const PanelManager = {
    /**
     * Clear Asset Panel
     */
    openClearAssetPanel() {
        Editor.Panel.open('eno-extensions');
    },
    clearFonts(folderUrl, sceneContent) {
        const fontType = 'bitmap-font';
        let deleteUrls = [];
        
        const queryCallback = (err, results) => {
            const fontTextureUuidList = []
            results.forEach((result) => {
                const textureUuid = Editor.assetdb.loadMetaByUuid(result.uuid).textureUuid;
                if (sceneContent.includes(result.uuid)) {
                    fontTextureUuidList.push(textureUuid);
                } else {
                    const fontUrl = Editor.assetdb.uuidToUrl(result.uuid);
                    const fontImageUrl = Editor.assetdb.uuidToUrl(textureUuid);
                    Editor.log('--- Remove Fonts ---');
                    Editor.log(fontUrl);
                    Editor.log(fontImageUrl);
                    deleteUrls.push(fontUrl);
                    deleteUrls.push(fontImageUrl);
                    Editor.assetdb.delete(deleteUrls, (err, results) => {
                        this.clearTextures(folderUrl, sceneContent, fontTextureUuidList);
                    });
                }
            });
            if (!deleteUrls.length) {
                this.clearTextures(folderUrl, sceneContent, fontTextureUuidList);
            }
        };

        Editor.assetdb.queryAssets(`${folderUrl}**\/*`, fontType, queryCallback);
    },
    clearTextures(folderUrl, sceneContent, fontTextureUuidList) {
        const textureTypes = ['sprite-frame', 'audio-clip', 'javascript'];

        const queryCallback = (err, results) => {
            let deleteUrls = [];
            results.forEach((result) => {
                if (result.type === 'javascript') {
                    if (!sceneContent.includes(compressUuid(result.uuid))) {
                        const fileUrl = Editor.assetdb.uuidToUrl(result.uuid);
                        deleteUrls.push(fileUrl)
                    }
                } else if (result.type === 'sprite-frame') {
                    if (!sceneContent.includes(result.uuid)) {
                        const rawTextureUuid = Editor.assetdb.loadMetaByUuid(result.uuid).rawTextureUuid;
                        if (!fontTextureUuidList.includes(rawTextureUuid)) {
                            const textureUrl = Editor.assetdb.uuidToUrl(rawTextureUuid);
                            deleteUrls.push(textureUrl)
                        }
                    }
                } else if (!sceneContent.includes(result.uuid)) {
                    const assetUrl = Editor.assetdb.uuidToUrl(result.uuid);
                    deleteUrls.push(assetUrl)
                }
            });
            if (deleteUrls.length) {
                Editor.log('--- Remove Files ---');
                deleteUrls.forEach(url => {
                    Editor.log(url);
                })
                Editor.assetdb.delete(deleteUrls, (err, results) => {
                    this.clearFolders(folderUrl, sceneContent);
                });
            } else {
                this.clearFolders(folderUrl, sceneContent);
            }
        };

        Editor.assetdb.queryAssets(`${folderUrl}**\/*`, textureTypes, queryCallback);
    },
    clearFolders(folderUrl, sceneContent) {
        const folderType = 'folder';

        const queryCallback = (err, results) => {
            let deleteUrls = [];
            results.forEach((result) => {
                const childFolderPath = Editor.assetdb.uuidToFspath(result.uuid);
                const childFolderUrl = Editor.assetdb.uuidToUrl(result.uuid);
                const totalFiles = fs.readdirSync(childFolderPath).length
                if (!totalFiles) {
                    deleteUrls.push(childFolderUrl)
                }
            })
            if (deleteUrls.length) {
                Editor.log('--- Remove Folders ---');
                deleteUrls.forEach(url => {
                    Editor.log(url);
                })
                Editor.assetdb.delete(deleteUrls, (err, results) => {
                    
                });
            }
        };
        

        Editor.assetdb.queryAssets(`${folderUrl}**\/*`, folderType, queryCallback);
    },
    clearAssets(sceneUuid) {
        Editor.log('Scene UUID', sceneUuid)
        const scenePath = Editor.assetdb.uuidToFspath(sceneUuid);
        const sceneUrl = Editor.assetdb.uuidToUrl(sceneUuid);
        const sceneContent = fs.readFileSync(scenePath).toString();

        const sceneObj = scenePath.split('/')
        const sceneName = sceneObj[sceneObj.length - 1];
        const folderPath = scenePath.replace(sceneName, '');
        const folderUrl = sceneUrl.replace(sceneName, '');

        Editor.log('Folder Path', folderPath);
        Editor.log('Folder Url', folderUrl);

        // const type = ''; //folder, prefab, bitmap-font, texture, sprite-frame, audio-clip, javascript
        this.clearFonts(folderUrl, sceneContent);

        // Editor.assetdb.refresh(folderUrl, () => {
        //     Editor.log('Refresh Folder');
        // });
    },

    /**
     * Clone Game Panel
     */
    cloneGamePanel: null,
    openCloneGamePanel() {
        if (this.cloneGamePanel) {
            this.closeCloneGamePanel();
            return;
        }
        const winSize = [800, 400],
            winPos = calcWindowPosition(winSize, 'center'),
            win = this.cloneGamePanel = new BrowserWindow({
                width: winSize[0],
                height: winSize[1],
                minWidth: winSize[0] * 0.6,
                minHeight: winSize[1] * 0.6,
                x: winPos[0],
                y: winPos[1] - 100,
                frame: true,
                title: 'Clone Game',
                autoHideMenuBar: true,
                resizable: true,
                minimizable: false,
                maximizable: false,
                fullscreenable: false,
                skipTaskbar: true,
                alwaysOnTop: true,
                hasShadow: true,
                show: false,
                webPreferences: {
                    nodeIntegration: true,
                },
            });
        win.loadURL(`file://${__dirname}/panels/cloneGame/index.html`);
        win.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'Escape') this.closeCloneGamePanel();
        });
        win.on('ready-to-show', () => win.show());
        win.on('closed', () => (this.cloneGamePanel = null));
    },
    closeCloneGamePanel() {
        if (!this.cloneGamePanel) {
            return;
        }
        this.cloneGamePanel.hide();
        this.cloneGamePanel.close();
        this.cloneGamePanel = null;
    },
};

module.exports = PanelManager;