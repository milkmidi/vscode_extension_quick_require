const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const wwwRoot = vscode.workspace.rootPath;
const TYPE_REQUIRE = 0;
const TYPE_IMPORT = 1;
const EXPORT_FUN_PATTERN_EXEC = /export (function|class) ([A-Za-z_]+)/g;
/**
 *
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const config = vscode.workspace.getConfiguration('quickrequire') || {};
  const INCLUDE_PATTERN = '/**/*.{' + config.include.toString() + "}";
  const EXCLUDE_PATTERN = '**/{' + config.exclude.toString() + '}';
  /**
   *
   * @param {number} type
   */
  var startPick = function (type) {
    vscode.workspace.findFiles(INCLUDE_PATTERN, EXCLUDE_PATTERN, 9999).then(result => {
      var edit = vscode.window.activeTextEditor;
      if (!edit) {
        return;
      }
      var items = [];
      var currentFile = edit.document.fileName;

      for (var i = 0; i < result.length; i++) {
        var o = result[i];
        if (currentFile == o.fsPath)
          continue;
        items.push({
          label: path.basename(o.path),
          description: o.fsPath.replace(wwwRoot, '').replace(/\\/g, "/"),
          fsPath: o.fsPath
        });
      }
      vscode.window.showQuickPick(items, {
        placeHolder: 'select file'
      }).then(value => {
        if (!value) {
          return;
        }
        var dirName = path.dirname(edit.document.fileName);
        var relativePath = path.relative(dirName, value.fsPath);
        relativePath = relativePath.replace(/\\/g, "/");
        var fileName = path.basename(value.fsPath);
        var extName = path.extname(value.fsPath);
        fileName = fileName.replace(extName, "");
        fileName = fileName.replace(/[\.\-]/g, "_");
        if (relativePath.indexOf("../") == -1) {
          relativePath = "./" + relativePath;
        }
        var fileString = fs.readFileSync(value.fsPath, "utf-8");
        var resultArr = stringMatchExportKeyWord(fileString);
        showExportFuncionNames(resultArr, fileName, type).then((scriptName) => {
          var script;
          if (type === TYPE_REQUIRE) {
            script = "const " + scriptName + " = require('" + relativePath + "');\n";
          } else {
            script = "import " + scriptName + " from '" + relativePath + "';\n";
          }
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
  var resultFunNameArr = [];
  var match;
  while (match = EXPORT_FUN_PATTERN_EXEC.exec(fileString)) {
    resultFunNameArr.push(match[2]);
  }
  return resultFunNameArr;
}

function showExportFuncionNames(funNameArr, fileName, type) {
  if (funNameArr.length == 0) {
    return Promise.resolve(fileName);
  }
  return new Promise((resolve, reject) => {
    var allFunNameArr = ["*as", "*"].concat(funNameArr);
    vscode.window.showQuickPick(allFunNameArr, {
      placeHolder: 'select modules'
    }).then(value => {
      var script = "";
      if (value === "*") {
        script = `{ ${funNameArr.toString()} }`;
      } else if (value === "*as") {
        script = type === TYPE_REQUIRE ? fileName : `*as ${fileName}`;
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