# smartcopy-manager

A small node.js REST API that currently serves as an aggregation point for backup logging and subsequent emails. This service is coupled with the 'http' notification method in SmartCopy.

Currently, manager uses a local SQLite database for persisting data.

## Requirements

### node.js

Tested with node.js runtime version v0.12.2 on SmartOS

## Using

var env = process.env.NODE_ENV || 'development';
var port = process.env.PORT || 3000;

The simpliest invocation is:
```bash
NODE_ENV=production /path/to/app.js
```

You can set the NODE_ENV and PORT environment variables using whichever method suits your environment. The default settings are 'development' and 3000 respectively.

## License
MIT.

## Bugs
See <https://github.com/davefinster/smartcopy/issues>.
