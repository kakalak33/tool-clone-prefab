'use strict';
function readScene(path) {
	const { readFileSync } = require('fs');
	const sceneString = readFileSync(path, { encoding: 'UTF-8' })
	return JSON.parse(sceneString);
}

function removeComponent(sceneUuid, targetUuid) {
	const scenePath = Editor.assetdb.uuidToFspath(sceneUuid);
	let sceneArr = readScene(scenePath);
	const { writeFileSync } = require('fs')

	// get all nodes having this script
	const scriptedNodes = [];
	sceneArr.forEach(sceneInfo => {
		if (sceneInfo.__type__ == targetUuid) {
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
}

module.exports = {

	messages: {
		'log'() {
			
		},
		'open'() {
			// open entry panel registered in package.json
			Editor.Panel.open('localize-tool');
		},
		'clicked'(evt, folderUuid, targetUuid) {
			const targetFolder = Editor.assetdb.uuidToUrl(folderUuid);

			Editor.assetdb.queryAssets(`${targetFolder}/**\/*`, ['scene', 'prefab'], (err, results) => {
				results.forEach(({ uuid, url }) => {
					Editor.log('=== Remove component in ' + url + ' ===');
					removeComponent(uuid, targetUuid);
				})
			})
			Editor.assetdb.refresh(targetFolder, () => Editor.log('=== Refresh folder ==='));
		},
	},
};