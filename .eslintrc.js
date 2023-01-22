const path = require('path');

module.exports = {
  "root": true,
  "extends": "pulsovi-typescript",
  "parserOptions": {
      "sourceType": "module",
      project: path.resolve(__dirname, 'tsconfig.json')
  },
  "rules": {
    "import/no-unused-modules": ["error", {
      "missingExports": true,
      "unusedExports": true,
      "ignoreExports": ["main.ts"]
    }],
    "node/no-unpublished-import": "off",
    "node/no-missing-import": "off",
    "sort-keys": ["warn", "asc", { "allowLineSeparatedGroups": true }]
  }
}
