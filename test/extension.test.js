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
            var extensionName = "milkmidi";
            export function add(){
            }
            export function sub(){
            }
            export class SampleClass(){                
            }
            export var foo = "foo";
        `;
        assert.equal( myExtension.stringMatchExportKeyWord( "milkmidi" ).length , 0 );
        assert.deepEqual( myExtension.stringMatchExportKeyWord( TEMPLATE_CODE ), [ "add", "sub" ] );        
    });
});