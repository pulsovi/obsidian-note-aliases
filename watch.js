const fs = require('fs');
const path = require('path');

let timeoutId = null;
const watcher = fs.watch('./main.js', { persistent: true }, (event, filename) => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => handleEvent(event, filename), 200);
});

function handleEvent (event, filename) {
  console.log(event, filename);
  const src = path.resolve('./main.js');
  const dest = `${process.argv[2]}/main.js`;
  console.log('copy file', src, 'to', dest);
  fs.copyFile(src, dest, (err) => {console.log(err)});
}
