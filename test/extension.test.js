const assert = require('assert');
const path = require('path');
// const vscode = require('vscode');
const {
  removeExtname,
  customCamelize,
  getRequirePath,
  stringMatchExportKeyWord,
  covertAliasPath,
} = require('../src/util');

suite('Extension Tests', () => {
  test('util.removeExtname', () => {
    assert.equal(removeExtname('milkmidi.js'), 'milkmidi');
    assert.equal(removeExtname('milkmidi'), 'milkmidi');
  });
  test('util.customCamelize', () => {
    assert.equal(customCamelize('milkmidi.util'), 'milkmidiUtil');
    assert.equal(customCamelize('milkmidi.abc.xyz'), 'milkmidiAbcXyz');
    assert.equal(customCamelize('milkmidi-abc-xyz'), 'milkmidiAbcXyz');
    assert.equal(customCamelize('MyComponent'), 'MyComponent');
  });
  test('util.getRequirePath', () => {
    // Windows
    if (path.sep === '\\') {
      const entry = 'd:\\github_milkmidi\\test\\src\\app.js';
      let reqPath = 'd:\\github_milkmidi\\test\\src\\component\\MyComponent.js';
      assert.equal(getRequirePath(entry, reqPath), './component/MyComponent');
      reqPath = 'd:\\github_milkmidi\\test\\src\\main.js';
      assert.equal(getRequirePath(entry, reqPath), './main');
      reqPath = 'd:\\github_milkmidi\\test\\webpack.config.js';
      assert.equal(getRequirePath(entry, reqPath), '../webpack.config');
      reqPath = 'd:\\github_milkmidi\\test\\src\\component\\index.js';
      assert.equal(getRequirePath(entry, reqPath), './component');
      reqPath = 'd:\\github_milkmidi\\test\\src\\component\\hi.vue';
      assert.equal(getRequirePath(entry, reqPath), './component/hi.vue');
    } else { // POSIX
      const entry = '/Users/milkmidi/github_milkmidi/test/src/app.js';
      let reqPath = '/Users/milkmidi/github_milkmidi/test/src/component/MyComponent.js';
      assert.equal(getRequirePath(entry, reqPath), './component/MyComponent');
      reqPath = '/Users/milkmidi/github_milkmidi/test/src/main.js';
      assert.equal(getRequirePath(entry, reqPath), './main');
      reqPath = '/Users/milkmidi/github_milkmidi/test/webpack.config.js';
      assert.equal(getRequirePath(entry, reqPath), '../webpack.config');
      reqPath = '/Users/milkmidi/github_milkmidi/test/src/component/index.js';
      assert.equal(getRequirePath(entry, reqPath), './component');
      reqPath = '/Users/milkmidi/github_milkmidi/test/src/component/hi.vue';
      assert.equal(getRequirePath(entry, reqPath), './component/hi.vue');
    }
  });

  test('stringMatchExportKeyWord', () => {
    const TEMPLATE_CODE = `
export function add(){
}
export function init() {
  console.log('init');
}
/**
 * @return  {{name:string,age:number}} obj
 */
export function foo() {
  console.log( 'foo' );
  return { name: "milkmidi", age: 18 };
}
export const arrowFunction = ()=> 'foo';
export var ACTION1 =  'action1';
export let ACTION2 =  'action2';
export class MyClass{}
export default class MyDefaultClass{

}
/*
export var commentFun2 = ()=>{

}
*/
export type MyType = {
  name: string,
};
    `;
    const exportArrResults = [
      'add',
      'init',
      'foo',
      'arrowFunction',
      'ACTION1',
      'ACTION2',
      'MyClass',
    ];
    const typeArrResults = [
      'MyType',
    ];
    const { exportDefault, exportArr, typeArr } = stringMatchExportKeyWord(TEMPLATE_CODE);
    assert.equal(exportDefault, 'MyDefaultClass');
    assert.deepEqual(exportArr, exportArrResults);
    assert.deepEqual(typeArr, typeArrResults);
  });
  test('util.covertAliasPath', () => {
    const entries = [
      '../util/sub/a',
      './util/sub/b',
      '../../util/sub/onlyExportDefault',
      '../../../util/foo',
    ];
    const aliasPath = '@/';
    assert.equal(covertAliasPath(entries[0]), '../util/sub/a');
    assert.equal(covertAliasPath(entries[0], aliasPath), '@/util/sub/a');
    assert.equal(covertAliasPath(entries[1], aliasPath), '@/util/sub/b');
    assert.equal(covertAliasPath(entries[2], aliasPath), '@/util/sub/onlyExportDefault');
    assert.equal(covertAliasPath(entries[3], aliasPath), '@/util/foo');
  });
});
