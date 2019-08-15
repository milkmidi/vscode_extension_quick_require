const path = require('path');
const fs = require('fs');

const LAST_INDEX_JS = /\/index\.(js|ts|jsx|tsx)$/;
const FUNNAME_REGEX_PATTERN = /^export (?:function|class|const|var|let) (\w+)/gm;
const EXPORT_DEFAULT_REGEX_PATTERN = /^export default (?:function|class) (\w+)/gm;
const EXPORT_DEFAULT_VAR_REGEX_PATTERN = /^export default ([a-zA-Z]+)/gm;
const TYPE_REGEX_PATTERN = /^export (?:type) (\w+)/gm;
const COMMENT_REGEX_PATTERN = /\*[^*]*\*+(?:[^/*][^*]*\*+)*/gm;
// const ALIAS_PATTERN = /(\.{1,2}\/)+/g;
/**
 * @param {string} text
 * @return {string}
 */
function customCamelize(text, separator = '_') {
  const newText = text.replace(/[\.\-]/g, '_');// eslint-disable-line
  const words = newText.split(separator);
  return words.reduce((prevValue, value, index) => {
    if (index === 0) {
      return value;
    }
    return prevValue + value.charAt(0).toUpperCase() + value.slice(1);
  }, '');
}
function getJSVarName(fsPath) {
  const extName = path.extname(fsPath);
  let jsName = '';
  if (LAST_INDEX_JS.test(fsPath)) {
    jsName = path.dirname(fsPath).split('\\').pop();
  } else {
    jsName = path.basename(fsPath);
  }
  return customCamelize(jsName.replace(extName, ''));
}
/**
 *
 * @param {string} filename
 * @return {string} filename
 */
function removeExtname(filename) {
  return filename.replace(/\.(js|jsx|ts|tsx)$/, '');
}


/**
 * relative fsPath and convert to path
 * @param {string} workspaceRoot
 * @param {string} fsPath
 */
function displayLabel(workspaceRoot, fsPath) {
  return path.relative(workspaceRoot, fsPath)
    .replace(/\\/g, '/')
    .replace(LAST_INDEX_JS, '');
}

/**
 * @param {string} editorFileName
 * @param {string} fsPath
 * @return {string}
 */
function getRequirePath(editorFileName, fsPath) {
  const editorFileDirname = path.dirname(editorFileName);
  let requirePath = path.relative(editorFileDirname, fsPath)
    .replace(/\\/g, '/')
    .replace(LAST_INDEX_JS, '');
  if (!/^\.\./.test(requirePath)) {
    requirePath = `./${requirePath}`;
  }
  return removeExtname(requirePath);
}
/**
 * @param {string} rawCodeStr
 * @return {object} module names
 */
function stringMatchExportKeyWord(rawCodeStr) {
  const resultObj = {
    exportDefault: null,
    exportArr: [],
    typeArr: [],
  };
  // ignore comment
  // eslint-disable-next-line
  rawCodeStr = rawCodeStr.replace(COMMENT_REGEX_PATTERN, '');

  rawCodeStr.replace(EXPORT_DEFAULT_REGEX_PATTERN, (...arg) => {
    // only match first export default
    if (!resultObj.exportDefault) {
      resultObj.exportDefault = arg[1]; // eslint-disable-line
    }
  });
  if (!resultObj.exportDefault) {
    rawCodeStr.replace(EXPORT_DEFAULT_VAR_REGEX_PATTERN, (...arg) => {
      resultObj.exportDefault = arg[1]; // eslint-disable-line
    });
  }
  rawCodeStr.replace(FUNNAME_REGEX_PATTERN, (...arg) => {
    resultObj.exportArr.push(arg[1]);
  });
  rawCodeStr.replace(TYPE_REGEX_PATTERN, (...arg) => {
    resultObj.typeArr.push(arg[1]);
  });

  return resultObj;
}

/**
 *
 * @param {string} fsPath
 * @return {string[]}
 */
function getCommonJSModuleFunctionNames(fsPath) {
  let resultObj = [];
  try {
    // module.exports
    resultObj = require(fsPath); // eslint-disable-line
    return Object.keys(resultObj);
  } catch (error) {
    // console.log(error);
  }
  return resultObj;
}

function getES6ModuleFunctionNames(fsPath) {
  const rawCodeStr = fs.readFileSync(require.resolve(fsPath), 'utf-8');
  const resultObj = stringMatchExportKeyWord(rawCodeStr);

  return resultObj;
}

function convertFunctionTypeToScript({ type, label }, oneModule = false) {
  if (type === 'export') {
    return oneModule ? `{ ${label} }` : `${label}`;
  } else if (type === 'type') {
    return oneModule ? `{ type ${label} }` : `type ${label}`;
  }
  return label;
}

/**
 *
 * @param {string} project root path
 * @param {string} modulePath
 * @param {object} aliasPath
 */
function covertAliasPath(rootPath, fsPath, aliasPath) {
  const requirePath = getRequirePath(rootPath, fsPath);
  if (aliasPath && Object.keys(aliasPath).length > 0) {
    const keys = Object.keys(aliasPath);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const value = aliasPath[key];
      const valueIdx = requirePath.indexOf(value);
      if (valueIdx > -1) {
        return key + requirePath.substr(valueIdx + value.length + 1);
      }
    }
  }
  return '';
}

module.exports = {
  getJSVarName,
  displayLabel,
  customCamelize,
  removeExtname,
  getRequirePath,
  stringMatchExportKeyWord,
  getCommonJSModuleFunctionNames,
  getES6ModuleFunctionNames,
  convertFunctionTypeToScript,
  covertAliasPath,
};
