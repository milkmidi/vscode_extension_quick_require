const vscode = require( 'vscode' );
const path = require( 'path' );
const fs = require( 'fs' );
const wwwRoot = vscode.workspace.rootPath;
const TYPE_REQUIRE = 0;
const TYPE_IMPORT = 1;
const EXPORT_FUN_PATTERN_EXEC = /export function ([A-Za-z_]+)\(\)\{/g;


function showExportFuncionNames( funNameArr, fileName, relativePath ) {
    var allFunNameArr = [ "*as", "*" ].concat( funNameArr );
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
/**
 *
 * @param {vscode.ExtensionContext} context
 */
function activate( context ) {
    const config = vscode.workspace.getConfiguration( 'quickrequire' ) || {};
    const INCLUDE_PATTERN = '/**/*.{' + config.include.toString() +"}";
    const EXCLUDE_PATTERN = '**/{' + config.exclude.toString() + '}';
    /**
     * 
     * @param {number} type 
     */
    var startPick = function( type ){
        vscode.workspace.findFiles( INCLUDE_PATTERN, EXCLUDE_PATTERN , 9999 ).then( result => {
            var edit = vscode.window.activeTextEditor;
            if ( !edit ) {
                return;
            }
            var items = [];
            var currentFile = vscode.Uri.file( edit.document.fileName ).fsPath;
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
            vscode.window.showQuickPick( items, { placeHolder: 'select file' }).then( value => {
                if ( !value ) {
                    return;
                }
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
                var script;
                if( type === TYPE_REQUIRE){
                    script = "const " + fileName + " = require(\"" + relativePath + "\");\n";
                } else {
                    var fileString = fs.readFileSync( value.fsPath, "utf-8" );
                    var resultArr = stringMatchExportKeyWord( fileString );
                    if ( resultArr.length > 0 ) {
                        showExportFuncionNames( resultArr, fileName, relativePath );
                        return;
                    }
                    script = "import " + fileName + " from \"" + relativePath + "\";\n";
                }
                insertScript( script );
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

function deactivate() {
}

/**
 *
 * @param {string} fileString
 */
function stringMatchExportKeyWord( fileString ) {
    var resultFunNameArr = [];
    var match;
    while ( match = EXPORT_FUN_PATTERN_EXEC.exec( fileString ) ) {
        resultFunNameArr.push( match[ 1 ] );
    }
    return resultFunNameArr;
}


module.exports = {
    activate,
    deactivate,
    stringMatchExportKeyWord,
}