var fs = require("fs"),
    exec = require('child_process').exec,
    os = require('os'),
    Space = require('space'),
    wrench = require('wrench'),
    util = require('util'),
    _ = require('underscore'),
    async = require('async')


var publicPath = __dirname + '/../../public/'
var appsPath = __dirname + '/../../apps/'
var corePath = __dirname + '/../'
var JSINCLUDES = ''
var JSMIN = ''
var CSSINCLUDES = ''
var CSSMIN = ''
var HTMLCOMPONENTS = ''


/*** LIB FILES ***/
var externalLibs = 'jquery-1.9.1.min.js jquery.dimensions.js Lasso.js validateEmail.js ParseQueryString.js Permalink.js jquery.scrollbar.js ToProperCase.js ParseName.js jquery.topdiv.js blinker.js Spectrum.js underscore.js marked.js natural_sort.js store.js goog.js events.js parseCookie.js MoveCursorToEnd.js socket.io.js moment.min.js jquery.sha256.min.js space.js scraps.js thumbs.js platform.js'.split(/ /)
_.each(externalLibs, function (fileName) {
  JSINCLUDES += '    <script type="text/javascript" src="/nudgepad/public/js/' + fileName + '"></script>\n'
  JSMIN += fs.readFileSync(publicPath + 'js/' + fileName, 'utf8')
})


/*** CORE FILES ***/

var jsFiles = _.without(fs.readdirSync(corePath + 'js'), '.DS_store')
// Do some reordering
jsFiles = _.without(jsFiles, 'Nudgepad.js', 'App.js')
jsFiles.unshift('Nudgepad.js')
jsFiles.unshift('App.js')
_.each(jsFiles, function (filename) {
  JSINCLUDES += '    <script type="text/javascript" src="/nudgepad/core/js/' + filename + '"></script>\n'
  JSMIN += fs.readFileSync(corePath + 'js/' + fileName, 'utf8')
})

var cssFiles = _.without(fs.readdirSync(corePath + 'css'), '.DS_store')
_.each(cssFiles, function (filename) {
  CSSINCLUDES += '    <link rel="stylesheet" href="/nudgepad/core/css/' + fileName + '" type="text/css"/>\n'
  CSSMIN += fs.readFileSync(corePath + 'css/' + fileName, 'utf8')
})

var htmlFiles = _.without(fs.readdirSync(corePath + 'html'), '.DS_store')
_.each(htmlFiles, function (fileName) {
  HTMLCOMPONENTS += fs.readFileSync(corePath + 'html/' + fileName, 'utf8')
})


/*** APPS ***/

var apps = _.without(fs.readdirSync(appsPath), '.DS_store')
_.each(apps, function (appName) {
  var appDir = appsPath + appName + '/'
  
  var cssFiles = _.without(fs.readdirSync(appDir + 'css'), '.DS_store')
  _.each(cssFiles, function (fileName) {
    CSSMIN += fs.readFileSync(appDir + 'css/' + fileName, 'utf8')
    CSSINCLUDES += '    <link rel="stylesheet" href="/nudgepad/apps/' + appName + '/' + fileName + '" type="text/css"/>\n'
  })
  
  var jsFiles = _.without(fs.readdirSync(appDir + 'js'), '.DS_store')
  _.each(jsFiles, function (fileName) {
    JSMIN += fs.readFileSync(appDir + 'js/' + fileName, 'utf8')
    JSINCLUDES += '    <script type="text/javascript" src="/nudgepad/apps/' + appName + '/' + filename + '"></script>\n'
  })
  
  var htmlFiles = _.without(fs.readdirSync(appDir + 'html'), '.DS_store')
  _.each(htmlFiles, function (fileName) {
    HTMLCOMPONENTS += fs.readFileSync(appDir + 'html/' + fileName, 'utf8')
  })
  
  SRC += '    <script type="text/javascript" src="/nudgepad/src/' + value + '"></script>\n'
  first = ' '
})


// BUILD HTML FILES
var buildTemplate = function (destination, source) {
  var file = fs.readFileSync(source, 'utf8')
  file = file.replace(/\nCSSINCLUDES\n/, '\n' + CSSINCLUDES + '\n')
  file = file.replace(/\nJSINCLUDES\n/, '\n' + JSINCLUDES + '\n')
  file = file.replace(/\nHTMLCOMPONENTS\n/, '\n' + HTMLCOMPONENTS + '\n')
  fs.writeFileSync(destination, file, 'utf8')  
}

buildTemplate(publicPath + 'nudgepad.dev.html', __dirname + '/nudgepad.dev.html')
buildTemplate(publicPath + 'nudgepad.min.html', __dirname + '/nudgepad.min.html')

fs.writeFileSync(publicPath + 'nudgepad.dev.css', CSSMIN, 'utf8')
fs.writeFileSync(publicPath + 'nudgepad.dev.js', JSMIN, 'utf8')

// min.css and min.js are generated by makefile

