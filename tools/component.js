/*
  
  Runs a specified entry file using a dev server (budo).
  Transforms `process.env.entry` into the entry, for "dynamic"
  requires.
 */

var path = require('path');
var requirePath = require('require-path-relative');
var notify = require('notify-error');
var isAbsolute = require('path-is-absolute');
var argv = require('minimist')(args(), {
  boolean: [ 'hmr', 'open' ],
  alias: {
    hmr: 'h',
    open: 'o'
  }
});

var entry = argv._[0];
var hmr = argv.hmr;
if (!entry) {
  console.error('Must specify entry. Example usage with tooler:\n' +
    '  tooler button1.vue');
  process.exit(1);
}

var cwd = process.cwd();
if (isAbsolute(entry)) {
  entry = path.relative(cwd, entry);
}

// test boilerplate that sets up Vue component
var testEntry = path.resolve(__dirname, '..', 'tests', 'component.js');
var file = requirePath(path.dirname(testEntry), cwd, entry);
var app = require('budo')(testEntry, {
  stream: process.stdout,
  live: !hmr,
  dir: path.resolve(__dirname, '..'), // static folder(s)
  open: argv.open,
  serve: 'bundle.js',
  browserify: {
    transform: [
      [ 'envify', { entry: file } ],
      'vueify'
    ],
    plugin: hmr ? [ 'browserify-hmr' ] : undefined
  }
});

if (hmr) { // extra alert when in HMR mode
  app.on('bundle-error', notify);
}

function args () {
  try { // try to get all from "npm test"
    var cooked = JSON.parse(process.env.npm_config_argv).cooked;
    if (cooked.indexOf('run') === 0 || cooked.indexOf('run-script') === 0) {
      cooked = cooked.slice(2);
    } else {
      cooked = cooked.slice(1);
    }
    if (cooked.indexOf('--') === 0) {
      return cooked.slice(1);
    } else {
      return cooked;
    }
  } catch (e) {
    return process.argv.slice(2);
  }
}