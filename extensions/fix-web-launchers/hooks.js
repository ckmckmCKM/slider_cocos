'use strict';

const fs = require('fs');
const path = require('path');

const LAUNCHER_FILES = [
  '打开游戏.bat',
];

function fixLaunchers(dest) {
  const projectRoot = Editor.Project.path;
  const srcDir = path.join(projectRoot, 'tools', 'web-mobile-launchers');
  if (!fs.existsSync(dest) || !fs.existsSync(srcDir)) {
    console.warn('[fix-web-launchers] skip: missing dest or source');
    return;
  }

  for (const name of LAUNCHER_FILES) {
    const from = path.join(srcDir, name);
    if (!fs.existsSync(from)) continue;
    fs.copyFileSync(from, path.join(dest, name));
    console.log(`[fix-web-launchers] wrote ${name}`);
  }

  for (const name of fs.readdirSync(dest)) {
    if (!name.toLowerCase().endsWith('.bat')) continue;
    if (LAUNCHER_FILES.includes(name)) continue;
    if (/\.[0-9a-f]{5}\.bat$/i.test(name)) {
      fs.unlinkSync(path.join(dest, name));
      console.log(`[fix-web-launchers] removed ${name}`);
    }
  }
}

exports.onAfterBuild = async function (options, result) {
  if (options.platform !== 'web-mobile') return;
  const dest = result.dest;
  fixLaunchers(dest);
};
