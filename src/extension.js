const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const {
  getRequirePath,
  displayLabel,
  getJSVarName,
  getCommonJSModuleFunctionNames,
  getES6ModuleFunctionNames,
  convertFunctionTypeToScript,
  covertAliasPath,
} = require('./util');


/**
 * FunctionType
 * @typedef {Object} FunctionType
 * @property {string} type function type, exportDefault | export | type
 * @property {string} label display name
 */

const rootPath = vscode.workspace.rootPath; // eslint-disable-line
const TYPE_REQUIRE = 0;
const TYPE_IMPORT = 1;

const getConfig = () => vscode.workspace.getConfiguration('quickrequire') || {};

function insertScript(script) {
  const edit = vscode.window.activeTextEditor;
  edit.edit((editBuilder) => {
    const position = edit.selection.active;
    editBuilder.insert(position, script);
  });
}
/**
 * @param {FunctionType[]} funNameArr
 * @param {string} jsName
 * @param {number} type
 */
function showExportFuncionNames(funNameArr, jsName, requireType) {
  // console.log(funNameArr);
  if (funNameArr.length <= 1) {
    const script = convertFunctionTypeToScript(funNameArr[0], true);
    return Promise.resolve(script);
  }
  return new Promise((resolve, reject) => {
    const allFunNameArr = ['* as', '*'].concat(funNameArr);
    const quickPickOptions = {
      placeHolder: 'select module',
    };
    vscode.window.showQuickPick(allFunNameArr, quickPickOptions).then((result/* FunctionType */) => {
      if (!result) {
        reject(new Error('user cancel'));
        return;
      }
      let script = '';
      if (result === '* as') {
        script = requireType === TYPE_REQUIRE ? jsName : `* as ${jsName}`;
      } else if (result === '*') {
        const exportDefaultArr = funNameArr.filter(({ type }) => type === 'exportDefault');
        if (exportDefaultArr.length > 0) {
          script = `${exportDefaultArr[0].label} `;
        }
        const moduleScript = funNameArr
          .filter(({ type }) => type !== 'exportDefault')
          .map(functionType => convertFunctionTypeToScript(functionType))
          .toString()
          .replace(/,/g, ', ');
        script += `{ ${moduleScript} }`;
      }
      if (script) {
        resolve(script);
        return;
      }

      const { type: functionType, label } = result;

      if (functionType === 'exportDefault') {
        script = label;
      } else if (functionType === 'export') {
        script = `{ ${label} }`;
      } else if (functionType === 'type') {
        script = `{ type ${label} }`;
      }
      resolve(script);
    });
  });
}

function getPackageJson() {
  const folder = vscode.workspace.rootPath;
  try {
    // eslint-disable-next-line
    const pkg = JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf-8'));
    return pkg;
  } catch (e) {
    console.warn('Unable to find package.json');
  }
  return {};
}

function loadInstalledModules() {
  const { ingorePackageJSONDependencies } = getConfig();
  if (ingorePackageJSONDependencies) {
    return [];
  }
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
      description: 'dependency',
      isDependencyPackage: true,
    };
  }).filter(d => d.fsPath);
}

function activate(context) {
  const config = vscode.workspace.getConfiguration('quickrequire') || {};
  const INCLUDE_PATTERN = `**/*.{${config.include.toString()}}`;
  const EXCLUDE_PATTERN = `**/{${config.exclude.toString()}}`;
  /**
   * @param {number} type
   */
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
        placeHolder: type === TYPE_REQUIRE ? 'require file' : 'import file',
      }).then((pickItem) => {
        if (!pickItem) {
          return;
        }
        // label: src/foo/a.js , src/foo/util
        // fsPath: d:\project\src\foo\a.js
        // isDependencyPackage boolean
        const { fsPath, label, isDependencyPackage } = pickItem;
        const fileName = isDependencyPackage ? label : getRequirePath(editorFileName, fsPath);
        const jsName = getJSVarName(fileName);
        if (isDependencyPackage) {
          const script =
            type === TYPE_REQUIRE
              ? `const ${jsName} = require('${fileName}');\n`
              : `import ${jsName} from '${fileName}';\n`;
          insertScript(script);
          return;
        }

        let functionNames = [];
        const commonjsFunctionNames = getCommonJSModuleFunctionNames(fsPath);
        if (commonjsFunctionNames.length) {
          functionNames = commonjsFunctionNames.map(functionName => ({
            type: 'export',
            label: functionName,
          }));
        } else {
          // eslint-disable-next-line
          let { exportDefault, exportArr, typeArr } = getES6ModuleFunctionNames(fsPath);
          if (!exportDefault
            && exportArr.length === 0
            && typeArr.length === 0) {
            exportDefault = jsName;
          }

          if (exportDefault) {
            functionNames.push({
              type: 'exportDefault',
              label: exportDefault,
              description: `export default ${exportDefault}`,
            });
          }
          if (exportArr.length > 0) {
            functionNames = functionNames.concat(exportArr.map(functionName => ({
              type: 'export',
              label: functionName,
              description: `export ${functionName}`,
            })));
          }
          if (typeArr.length > 0) {
            functionNames = functionNames.concat(typeArr.map(functionName => ({
              type: 'type',
              label: functionName,
              description: `type ${functionName}`,
            })));
          }
        }

        showExportFuncionNames(functionNames, jsName, type).then((scriptName) => {
          const { aliasPath } = config;
          let modulePath = fileName;
          if (aliasPath) {
            modulePath = covertAliasPath(fileName, aliasPath);
          }
          console.log(aliasPath);
          const script =
            type === TYPE_REQUIRE
              ? `const ${scriptName} = require('${modulePath}');\n`
              : `import ${scriptName} from '${modulePath}';\n`;
          insertScript(script);
        }).catch(() => {

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
