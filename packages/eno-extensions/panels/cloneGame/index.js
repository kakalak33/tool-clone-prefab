const { ipcRenderer } = require('electron');

let btn = document.getElementById('btn');
btn.addEventListener('click', () => {
    console.log('btn', btn)
    ipcRenderer.send('eno-extensions:clicked');
});