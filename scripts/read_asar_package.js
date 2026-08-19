const asar = require('asar');
try {
  const buf = asar.extractFile('dist-electron/win-unpacked/resources/app.asar', 'package.json');
  console.log(buf.toString());
} catch (e) {
  console.error('ERROR', e && e.message);
  process.exit(1);
}
