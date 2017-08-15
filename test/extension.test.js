const assert = require('assert');
// const vscode = require('vscode');
const {
  removeExtname,
  customCamelize,
  getRequirePath,
  stringMatchExportKeyWord,
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
      /**
       * @param  {function( number )} cb
       */
      export function callback(cb) {
        cb( 9527 );
      }
      export const arrowFunction = ()=> 'foo';
      export const ACTION1 =  'action1';
      export const ACTION2 =  'action2';
      export class MyClass{}
    `;
    assert.equal(stringMatchExportKeyWord('milkmidi').length, 0);
    const results = [
      'add',
      'init',
      'foo',
      'callback',
      'arrowFunction',
      'ACTION1',
      'ACTION2',
      'MyClass'];
    assert.deepEqual(stringMatchExportKeyWord(TEMPLATE_CODE), results);
  });
});
