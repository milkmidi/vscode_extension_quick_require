# vs-code-quick-require README

## Features

![install and work](https://raw.githubusercontent.com/milkmidi/vscode_extension_quick_require/master/img/screen.gif)

quick require js

# Usage
## Available commands
* **Quick Require** 
* default shortcut `Ctrl+Shift+1` --> require
* default shortcut `Ctrl+Shift+2` --> import

**Enjoy!**


## Change Log
- 3.1.0
  - bug fixed
  - support flowjs export key word
  - new settings
    - ingorePackageJSONDependencies default false
    - aliasPath default ''
    ```js
    import MyModule from '../../../components/MyModule';
    // translate to aliasPath
    import MyModule from '@/components/MyModule';
    ```
- 0.3.0 Support loading package.json, Thanks Giancarlo Anemone https://github.com/ganemone