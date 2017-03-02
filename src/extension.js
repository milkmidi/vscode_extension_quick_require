const vscode = require( 'vscode' );
const path = require( 'path' );
const fs = require( 'fs' );
// const Uri = require('Uri')
const wwwRoot = vscode.workspace.rootPath;
const TYPE_REQUIRE = 0;
const TYPE_IMPORT = 1;
const EXPORT_FUN_PATTERN_MATCH = /export function ([A-Za-z_]+)\(\)\{/g;
const EXPORT_FUN_PATTERN_EXEC = /export function ([A-Za-z_]+)\(\)\{/;
function showExportFuncionNames( funNameArr, fileName, relativePath ) {    
    var allFunNameArr = [ "*" , "*as" ].concat( funNameArr );
    vscode.window.showQuickPick( allFunNameArr, { placeHolder: 'select file' } ).then( value => {
        var script = "";
        if ( value === "*" ) {
            script = `import { ${funNameArr.toString()} } from "${relativePath}";`;           
        } else if ( value == "*as"){
            script = `import *as ${fileName} from "${relativePath}";`;
        } else {
            script = `import {${value}} from "${relativePath}";`;
        }
        insertScript( script );
    } );
}
function insertScript( script ) {
    var edit = vscode.window.activeTextEditor;
    edit.edit( editBuilder  => {                    
        const position = edit.selection.active;
        editBuilder.insert( position, script );
    });         
}
function activate( context ) {
    const config = vscode.workspace.getConfiguration( 'quickrequire' ) || {};
    const include = config.include;
    const exclude = config.exclude;        
    // const includePattern = include.reduce( (pre,cur,index ,arr) => { return pre + '**/*.'+cur + (index == arr.length-1 ? '}' : ','); } ,"{");
    const includePattern = '/**/*.{' + include.toString() +"}"; 
    // console.log( includePattern );
    // const excludePattern = exclude.reduce( (pre,cur,index ,arr) => { return pre + '**/'+cur + (index == arr.length-1 ? '}' : ','); } ,"{");
    const excludePattern = '**/{' + exclude.toString() + '}';
    // console.log( excludePattern );


    
    var startPick = function( type ){
        vscode.workspace.findFiles( includePattern, excludePattern , 9999 ).then( result => {
            var edit = vscode.window.activeTextEditor;
            if ( !edit ) {
                return;
            }
            var items = [];
            // var dirName = path.dirname( edit.document.fileName );
            var currentFile = vscode.Uri.file( edit.document.fileName ).fsPath;
            // console.log( edit.document.fileName );
            for ( var i = 0; i < result.length; i++ ) {
                var o = result[ i ];
                if ( currentFile == o.fsPath )
                    continue;    
                items.push( {
                    label: path.basename( o.path ),                    
                    description: o.fsPath.replace( wwwRoot, '' ).replace( /\\/g, "/" ),                    
                    fsPath: o.fsPath
                });
            }            
            vscode.window.showQuickPick( items, { placeHolder: 'select file' }).then(( value ) => {
                if ( !value ) {
                    return;
                }
                
               
               
                // console.log(value.fsPath);                
                // var req = require(value.fsPath);
                // console.log(req);
                // console.log(result);
                var dirName = path.dirname( edit.document.fileName );
                var relativePath = path.relative( dirName,  value.fsPath );
                relativePath = relativePath.replace( /\\/g, "/" );
                var fileName = path.basename( value.fsPath );
                var extName = path.extname( value.fsPath );
                fileName = fileName.replace( extName, "" );
                fileName = fileName.replace( /[\.\-]/g, "_" );
                if ( relativePath.indexOf( "../" ) == - 1 ) {
                    relativePath = "./" + relativePath;
                }
                // relativePath = relativePath.replace('.js','');
            

                var script;
                if( type === TYPE_REQUIRE){
                    script = "const " + fileName + " = require(\"" + relativePath + "\");\n";
                } else {
                    var fileString = fs.readFileSync( value.fsPath, "utf-8" );
                    var matchArr = fileString.match( EXPORT_FUN_PATTERN_MATCH );                          
                    if ( matchArr && matchArr.length > 0 ) {
                        var resultArr = [];
                        for ( var a in matchArr ) {
                            var result = EXPORT_FUN_PATTERN_EXEC.exec( matchArr[ a ] );                    
                            if ( result != null && result.length == 2 ) {
                                resultArr.push( result[ 1 ] );
                            }
                        }
                        showExportFuncionNames( resultArr, fileName, relativePath );
                        
                        return;
                    }
                    script = "import " + fileName + " from \"" + relativePath + "\";\n";
                }
                insertScript( script );                
                /*edit.edit(( editBuilder ) => {                    
                    const position = edit.selection.active;
                    editBuilder.insert( position, script );
                });         */
            });
        });
    };
    var disposable = vscode.commands.registerCommand( 'extension.quickRequire', ()=> {        
        startPick( TYPE_REQUIRE );
    });
    context.subscriptions.push( disposable );

    disposable = vscode.commands.registerCommand( 'extension.quickRequire_import', ()=> {
        startPick( TYPE_IMPORT);
    });    
    context.subscriptions.push( disposable );
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;