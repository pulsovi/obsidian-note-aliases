const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');

const destDir = '.\\TestVault\\.obsidian\\plugins\\obsidian-note-aliases';

function main () {
  return new Promise((resolve, reject) => {
    const watcher = chokidar.watch([
      './main.js',
      './manifest.json',
      './styles.css',
    ]);

    watcher
      .on('ready', () => {
        console.log('ready');
      })
      .on('change', filename => {
        console.log(filename);
        fs.copyFile(path.resolve('.', filename), path.join(destDir, filename));
      })
      .on('error', (error) => {
        watcher.close();
        reject(error);
      });
  });
}

main().then(() => console.log('END'), err => console.log(err));
