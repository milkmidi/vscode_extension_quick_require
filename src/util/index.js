const path = require('path');
const fs = require('fs');

const LAST_INDEX_JS = /\/index\.js$/;
const FUNNAME_REGEX_PATTERN = /export (?:function|class|const) (\w+)/g;

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
  if (/index\.js$/.test(fsPath)) {
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
 * @param {string} fileString
 */
function stringMatchExportKeyWord(fileString) {
  const resultNames = [];
  fileString.replace(FUNNAME_REGEX_PATTERN, (...arg) => {
    resultNames.push(arg[1]);
  });
  return resultNames;
}


function getModuleFunctionNames(fsPath) {
  try {
    // module.exports
    const resultObj = require(fsPath); // eslint-disable-line
    return Object.keys(resultObj);
  } catch (error) {
    // console.log(error);
  }
  const fileStr = fs.readFileSync(fsPath, 'utf-8');
  return stringMatchExportKeyWord(fileStr);
}


module.exports = {
  getJSVarName,
  displayLabel,
  customCamelize,
  removeExtname,
  getRequirePath,
  stringMatchExportKeyWord,
  getModuleFunctionNames,
};
