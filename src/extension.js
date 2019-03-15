const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const {
  getRequirePath,
  displayLabel,
  getJSVarName,
  getModuleFunctionNames,
} = require('./util');

const rootPath = vscode.workspace.rootPath; // eslint-disable-line
const TYPE_REQUIRE = 0;
const TYPE_IMPORT = 1;


function insertScript(script) {
  const edit = vscode.window.activeTextEditor;
  edit.edit((editBuilder) => {
    const position = edit.selection.active;
    editBuilder.insert(position, script);
  });
}

function showExportFuncionNames(funNameArr, jsName, type) {
  if (funNameArr.length === 0) {
    return Promise.resolve(jsName);
  }
  return new Promise((resolve) => {
    const allFunNameArr = ['* as', '*'].concat(funNameArr);
    vscode.window.showQuickPick(allFunNameArr, {
      placeHolder: 'select modules',
    }).then((value) => {
      let script = '';
      if (value === '*') {
        script = `{ ${funNameArr.filter(n => n !== 'default').toString().replace(/,/g, ', ')} }`;
      } else if (value === '* as') {
        script = type === TYPE_REQUIRE ? jsName : `* as ${jsName}`;
      } else if (value === 'default') {
        script = `${jsName}`;
      } else {
        script = `{ ${value} }`;
      }
      resolve(script);
    });
  });
}

function getPackageJson() {
  const folder = vscode.workspace.rootPath;
  try {
    // eslint-disable-next-line
    const pkg = require(path.join(folder, 'package.json'));
    return pkg;
  } catch (e) {
    console.warn('Unable to find package.json');
  }
  return {};
}

function loadInstalledModules() {
  const folder = vscode.workspace.rootPath;
  const pkg = getPackageJson();
  const deps = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
  const dev = pkg.devDependencies ? Object.keys(pkg.devDependencies) : [];
  const allDeps = deps.concat(dev);
  return allDeps.map((d) => {
    const depFolderPath = path.join(folder, 'node_modules', d);
    let fsPath = null;
    try {
      fsPath = require.resolve(depFolderPath);
    } catch (e) {
      // console.log(e);
    }
    return {
      label: d,
      fsPath,
      isAbsolute: true,
    };
  }).filter(d => d.fsPath);
}

function activate(context) {
  const config = vscode.workspace.getConfiguration('quickrequire') || {};
  const INCLUDE_PATTERN = `**/*.{${config.include.toString()}}`;
  const EXCLUDE_PATTERN = `**/{${config.exclude.toString()}}`;

  const startPick = (type) => {
    const installedModules = loadInstalledModules();
    vscode.workspace.findFiles(INCLUDE_PATTERN, EXCLUDE_PATTERN, 9999).then((uriResults) => {
      const { activeTextEditor } = vscode.window;
      if (!activeTextEditor) {
        return;
      }
      const { fileName: editorFileName } = activeTextEditor.document;
      const items = uriResults.reduce((arr, uri) => {
        if (editorFileName !== uri.fsPath) {
          arr.push({
            label: displayLabel(rootPath, uri.fsPath),
            fsPath: uri.fsPath,
          });
        }
        return arr;
      }, []).concat(installedModules);

      vscode.window.showQuickPick(items, {
        placeHolder: 'select file',
      }).then((value) => {
        if (!value) {
          return;
        }
        // label: src/foo/a.js , src/foo/util
        // fsPath: d:\project\src\foo\a.js
        const { fsPath, label, isAbsolute } = value;
        const fileName = isAbsolute ? label : getRequirePath(editorFileName, fsPath);
        const jsName = getJSVarName(fileName);
        const resultArr = getModuleFunctionNames(fsPath);
        showExportFuncionNames(resultArr, jsName, type).then((scriptName) => {
          const script =
            type === TYPE_REQUIRE
              ? `const ${scriptName} = require('${fileName}');\n`
              : `import ${scriptName} from '${fileName}';\n`;
          insertScript(script);
        });
      });
    });
  };
  let disposable = vscode.commands.registerCommand('extension.quickRequire', () => {
    startPick(TYPE_REQUIRE);
  });
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand('extension.quickRequire_import', () => {
    startPick(TYPE_IMPORT);
  });
  context.subscriptions.push(disposable);
}


function deactivate() {}


module.exports = {
  activate,
  deactivate,
};
