const assert = require('assert');
const vscode = require('vscode');
const myExtension = require('../src/extension');

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function () {
  test("stringMatchExportKeyWord", function () {
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
        export function callback( cb ) {
            cb( 9527 );
        }
        export class MyClass{}
    `;
    const TEMPLATE_CODE2 = ` 
      function add( a, b ) {
          return a + b;
      }  
      function subtract( a, b ) {
          return a - b;
      }
      function multiply( a, b ) {
          return a * b;
      }
      function divide( a, b ) {
          return a / b;
      }
      module.exports = { add, subtract, multiply, divide };
      `;
    assert.equal(myExtension.stringMatchExportKeyWord("milkmidi").length, 0);
    assert.equal(myExtension.stringMatchExportKeyWord(TEMPLATE_CODE2).length, 0);
    assert.deepEqual(myExtension.stringMatchExportKeyWord(TEMPLATE_CODE), ["add", "init", "foo", "callback", "MyClass"]);
  });
});