/* global suite, test */

//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
var assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
var vscode = require('vscode');
var myExtension = require('../src/extension');

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function() {
    test( "stringMatchExportKeyWord", function () {
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
        `
        assert.equal( myExtension.stringMatchExportKeyWord( "milkmidi" ).length , 0 );
        assert.equal( myExtension.stringMatchExportKeyWord( TEMPLATE_CODE2 ).length , 0 );
        assert.deepEqual( myExtension.stringMatchExportKeyWord( TEMPLATE_CODE ), [ "add", "init", "foo", "callback" ] );        
        

    });
});