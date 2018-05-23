# Configuration Module
This module is responsible for handling configuration of various modules. To instantiate this object, use the following import:

**Require Syntax:**
```javascript
const { getConfigManager } = require('../global_configuration')
```

**ES6+ Import Syntax:**
```javascript
import { getConfigManager } from '../global_configuration';
```

## Configuration
All module configuration is done in `global.json`. The `properties` section refers to global properties which are needed by many modules in the system. The `jobs` section refers to individual jobs having their own properties.

### Global Properties
|Property|Required Type|Description|
|--------|-------------|-----------|
|`chain_config_file_path`|`string`|Absolute path pointing to the chain configuration file which will be used.|
|`accounts_file_path`|`string`|Absolute path pointing to the accounts file for the chain to be used. Optionally can implement the variable `%CHAINNAME%` which will be replaced with the name of the current chain as defined in the chain configuration file.|
|`primary_account`|`string`|The name of the primary account to be used for transactions.|

### Module Properties
|Property|Required Type|Description|
|--------|-------------|-----------|
|`base_path`|`string`|Absolute path to where this module is located on the system. This path will be used to append various hard-coded file names for accessing vital data (i.e. `jobs_output.json`). For example, if the `jobs_output.json` file is at the path `/home/test/jobs/module_something/jobs_output.json`, only the directory (`/home/test/jobs/module_something/`) is put into this entry **without a trailing slash**.|

## Functions Available

### `getChainConfig()`
This function points to the chain configuration file at the path defined in the `properties.chain_config_file_path` entry of `global.json`.

**Returns:** 

Parsed JSON `Object` represented by the contents of the applicable configuration file.

**Usage:**
```javascript
const chainConfig = getConfigManager().getChainConfig();
```

### `getAccountConfig()`
This function points to the accounts configuration for the current blockchain as defined in the chain configuration. This function automatically calls `getChainConfig()` to retrieve the most current chain configuration (i.e. the chain name) to retrieve the accounts list for. The function will retrieve the data from the path specified in the `properties.accounts_file_path` entry of `global.json` where the `%CHAINNAME%` variable is replaced at runtime with the name of the current chain being accessed (per chain config).

**Returns:**

Parsed JSON `Object` represented by the applicable json file being referenced.

**Usage:**
```javascript
const accountConfig = getConfigManager().getAccountConfig();
```

### `getGlobalConfig(erisReference)`
This function returns the basic setup needed for most blockchain functions as a re-constructed object of those necessary imports.

**Parameters:**

|Parameter|Required Type|Description|
|---------|-------------|-----------|
|`erisReference`|`Object`|A reference to an existing import of `@monax/legacy-contracts`.

**Returns:**

Re-constructed `Object` containing the required imports and dependencies which can then be deconstructed when needed.

**Usage:**
```javascript
const globalConfig = getConfigManager().getGlobalConfig();

  const { chain } = globalConfig;
  const { primaryAccount } = globalConfig;
  const { erisdburl } = globalConfig;
  const { accountData } = globalConfig;
  const { contractMgr } = globalConfig;
```

### `getGlobalProperties()`
This function points to the global properties currently in use by the system, per `global.json`. By using this function, one can retrieve the object and modify properties temporarily such that they will not be saved to `global.json`. This function can also be used to peek at absolute paths provided in the configuration. There is a file watcher on `global.json` to allow for hot updates to the file without reloading the module itself. When a change is detected in `global.json` the global properties object will update itself in the current runtime.

**Returns:**

Parsed JSON `Object` represented by `global.json` in its current state.

**Usage:**
```javascript
const properties = getConfigManager().getGlobalProperties();
```

### `getModuleConfig(basePath, callback)`
**This function is async and ideally should be `await`ed.** This function retrieves the jobs output file for a module at a given base path. The dynamic base path for a given module can be retrieved from `getGlobalProperties()`.

**Parameters:**

|Parameter|Required Type|Description|
|---------|-------------|-----------|
|`basePath`|`string`|Absolute path to where the applicable module is located on the contextual system.|
|`callback`|`function`|A callback function which handles `(err, result)` where `err` is the error (if defined) and `result` is the parsed contents of the `jobs_output.json` file in `Object` form.

**Returns:**

Parsed JSON `Object` represented by the applicable `jobs_output.json`. Raises an exception if parse or read fails - error is stored in the `err` parameter of the defined callback.

**Usage:**
```javascript
const globalProperties = getConfigManager().getGlobalProperties();

this.contractData = await getConfigManager().getModuleConfig(globalProperties.jobs.myGatekeeper.base_path, (err, result) => {
    this.contractAbiAddress = this.contractData.MyGateKeeper;
    this.erisAbi = JSON.parse(fs.readFileSync(`./abi/${this.contractAbiAddress}`));
});
```