const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const rootPath = vscode.workspace.rootPath;
const TYPE_REQUIRE = 0;
const TYPE_IMPORT = 1;
const EXPORT_FUN_PATTERN_EXEC = /export (function|class|const) ([A-Za-z_]+)/g;
const LAST_INDEX_JS = /\/index\.js$/;
/**
 * relative fsPath and convert to path
 * @param {string} root
 * @param {string} filePath
 */
const displayLabel = (root , fileFsPath) => {
  return path.relative(root, fileFsPath)
          .replace(/\\/g, '/')
          .replace(LAST_INDEX_JS,'');
};

const convertValidJSName = (fsPath) => {
  const extName = path.extname(fsPath);
  return path.basename(fsPath).replace(extName, '').replace(/[\.\-]/g, '_')
};
const getFileName = (editorFileName, fsPath) => {
  const basename = path.basename(fsPath);
  const editorFileDirName = path.dirname(editorFileName);
  const toFileDirName = path.dirname(fsPath);
  let fileName = path.relative(editorFileDirName, toFileDirName).replace(/\\/g, '/');
  if (fileName.indexOf('..') ===0){
    fileName = fileName + '/';
  }else {
    fileName = './' + fileName;
  }
  return fileName + basename;

  /* let fileName = label;
  const extName = path.extname(label);
  if (fileName.indexOf('../') === -1) {
    fileName = './' + fileName;
  }
  // console.log(fileName);
  // console.log(LAST_INDEX_JS.test(fileName));
  fileName = fileName.replace(extName,'');
  return fileName; */
}
function activate(context) {
  const config = vscode.workspace.getConfiguration('quickrequire') || {};
  const INCLUDE_PATTERN = '/**/*.{' + config.include.toString() + "}";
  const EXCLUDE_PATTERN = '**/{' + config.exclude.toString() + '}';

  const startPick = function (type) {
    vscode.workspace.findFiles(INCLUDE_PATTERN, EXCLUDE_PATTERN, 9999).then(uriResults => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        return;
      }
      // d:\project\entry.js
      const { fileName:editorFileName } = activeEditor.document;
      const items = uriResults.reduce((arr , uri) => {
        if (editorFileName !== uri.fsPath) {
          arr.push({
            label: displayLabel(rootPath, uri.fsPath),
            fsPath: uri.fsPath,
          });
        }
        return arr;
      }, []);

      vscode.window.showQuickPick(items, {
        placeHolder: 'select file'
      }).then(value => {
        if (!value) {
          return;
        }
        // label: src/foo/a.js , src/foo/util
        // fsPath: d:\project\src\foo\a.js
        let { label, fsPath } = value;
        const fileName = getFileName(editorFileName, fsPath);
        console.log(fileName);
        const filePath = path.relative(editorFileName, fsPath);
        // console.log(filePath);
        const jsName = convertValidJSName(fsPath);
        const fileStr = fs.readFileSync(fsPath, "utf-8");
        const resultArr = stringMatchExportKeyWord(fileStr);
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
  var disposable = vscode.commands.registerCommand('extension.quickRequire', () => {
    startPick(TYPE_REQUIRE);
  });
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand('extension.quickRequire_import', () => {
    startPick(TYPE_IMPORT);
  });
  context.subscriptions.push(disposable);
}

function deactivate() {}
/**
 *
 * @param {string} fileString
 */
function stringMatchExportKeyWord(fileString) {
  let resultFunNameArr = [];
  let match;
  while (match = EXPORT_FUN_PATTERN_EXEC.exec(fileString)) {
    resultFunNameArr.push(match[2]);
  }
  return resultFunNameArr;
}

function showExportFuncionNames(funNameArr, jsName, type) {
  if (funNameArr.length == 0) {
    return Promise.resolve(jsName);
  }
  return new Promise((resolve, reject) => {
    var allFunNameArr = ['*as', '*'].concat(funNameArr);
    vscode.window.showQuickPick(allFunNameArr, {
      placeHolder: 'select modules'
    }).then(value => {
      var script = '';
      if (value === '*') {
        script = `{ ${funNameArr.toString()} }`;
      } else if (value === '*as') {
        script = type === TYPE_REQUIRE ? jsName : `*as ${jsName}`;
      } else {
        script = `{${value}}`;
      }
      resolve(script);
    });
  });

}

function insertScript(script) {
  var edit = vscode.window.activeTextEditor;
  edit.edit(editBuilder => {
    const position = edit.selection.active;
    editBuilder.insert(position, script);
  });
}

module.exports = {
  activate,
  deactivate,
  stringMatchExportKeyWord,
}