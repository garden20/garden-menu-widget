var css2json = require('css2json'),
  fs = require('fs'),
  path = require('path');


var main_src = [
  "garden-menu-widget.js",
  "src/garden-menu-widget.css.js",
  "src/topbar.js"
];

var template_dirs = ["templates/*.underscore"];

/* ORDER HERE is _Very_ Important */
var bundle_js = [
  "lib/zepto.js",
  "lib/url.js",
  "jam/async/lib/async.js",
  "jam/underscore/underscore.js",
  "jam/events/events.js",
  "jam/stately/Stately.js",
  "jam/svg/dist/svg.js",
  "jam/sync-status-icon/sync-status-icon.js",
  "jam/md5/md5.js",
  "jam/querystring/querystring.js",
  "jam/gravatar/gravatar.js",
  "lib/bowser.js",
  "lib/pouchdb-nightly.js",
  "lib/Modernizer.custom.js",
  "jam/garden-views/garden-views.js",
  "jam/garden-dashboard-core/garden-dashboard-core.js",
  "jam/garden-default-settings/garden-default-settings.js",
  "jam/garden-menu/garden-menu.js",

  "jam/jscss/lib/index.js",
  "lib/alertify.js",
  "lib/foundation.js",
  "lib/foundation.topbar.js",
  //"lib/foundation.joyride.js",
  "lib/foundation.dropdown.js",
  "temp/templates.js",
  "dist/compiled_css.js",
  "src/garden-menu-widget.css.js",
  "garden-menu-widget.js",
  "src/topbar.js"
];

var extraCss = [

  {
    "file": "css/foundation.topbar.css",
    "prefix": true
  },
  {
    "file": "css/foundation.dropdown.css",
    "prefix": true
  },
  {
    "file": "css/alertify.css",
    "prefix": false
  },
  {
    "file": "css/alertify.default.css",
    "prefix": false
  }
];

var dist_topbar = "dist/topbar.js";
var dist_topbar_min = "dist/topbar.min.js";

var couch_config = {
  test: {
            db: 'http://localhost:5984/garden_menu_widget',
            app: './test/basic_couchapp/app.js',
            options: {
              okay_if_missing: true
            }
          }
};

var qunit_tests = [
  'http://localhost:5984/garden_menu_widget/_design/gmw/basic/basic.html',
  'http://localhost:5984/garden_menu_widget/_design/gmw/fauxton/fauxton.html',
  'http://localhost:5984/garden_menu_widget/_design/gmw/no_session/no_session.html'
];

// borrowed from https://github.com/requirejs/text/blob/master/text.js#L44
var jsEscape = function (content) {
      return content.replace(/(['\\])/g, '\\$1')
          .replace(/[\f]/g, "\\f")
          .replace(/[\b]/g, "\\b")
          .replace(/[\n]/g, "\\n")
          .replace(/[\t]/g, "\\t")
          .replace(/[\r]/g, "\\r")
          .replace(/[\u2028]/g, "\\u2028")
          .replace(/[\u2029]/g, "\\u2029");
};

module.exports = function(grunt) {


  // Project configuration.
  grunt.initConfig({
    meta: {
      banner:"/*Garden Topbar*/",
      inline:{
        top : "(function() { var mlt='g',ml=null; if (typeof exports === 'object') {ml=exports;exports=undefined;mlt='r'} else if (typeof define === 'function' && define.amd) {ml=define;define=undefined;mlt='a'} ",
        bottom : "if (mlt==='r') {exports=ml;} if (mlt==='a'){define=ml;} })() "
      },
      css: {
        top: "(function (root, factory) {if (typeof exports === 'object') {module.exports = factory(); } else if (typeof define === 'function' && define.amd) {define([],factory); } else { root.garden_menu_widget_extra_css = factory();} }(this, function () {  ",
        bottom: "  }));"
      }
    },
    lint: {
      all: main_src
    },
    jst: {
      compile: {
        files: {
          "temp/templates.js": template_dirs
        }
      }
    },

    concat: {
      css: {
        src: grunt.utils._.flatten([
          "<banner:meta.css.top>", "temp/temp.css", "<banner:meta.css.bottom>"
        ]),
        dest: 'dist/compiled_css.js'
      },
      all: {
        src: grunt.utils._.flatten([
          "<banner>","<banner:meta.inline.top>", bundle_js, "<banner:meta.inline.bottom>"
        ]),
        dest: dist_topbar
      }
    },
    min: {
      dist: {
        src: dist_topbar,
        dest: dist_topbar_min
      }
    },
    jam: {
        dist: {
          src: ['garden-menu-widget.js'],
          dest: 'dist/garden-menu-widget.amd.min.js'
        }
      },
    couchapp: couch_config,
    mkcouchdb: couch_config,
    rmcouchdb: couch_config,
    qunit: {
      all: qunit_tests
    }
  });

  grunt.loadNpmTasks('grunt-jam');
  grunt.loadNpmTasks('grunt-contrib-jst');
  // Load the couchapp task
  grunt.loadNpmTasks('grunt-couchapp');

  grunt.registerTask('css2str', 'My "asyncfoo" task.', function() {
    // Force task into async mode and grab a handle to the "done" function.
    var done = this.async();

    var insertPrefix = require('css-prefix');

    var full_css = '';

    grunt.util.async.forEach(extraCss, function(details, cb) {
      var basePath = path.join(__dirname, details.file);
      var css = fs.readFileSync(basePath, 'utf8');



      if (details.prefix) {
         css = insertPrefix({
             prefix : '',
             parentClass : 'dashboard-topbar'
         }, css);
      }

      full_css = [full_css, css].join('\n');
      cb();
    }, function(){
      grunt.config.set('extraCss', full_css);
      try { fs.mkdirSync('temp'); } catch(ignore){}

      var escaped_css = "return '" + jsEscape(full_css)  + "'";

      fs.writeFileSync('temp/temp.css', escaped_css);
      done();
    });
  });



  // Default task.
  grunt.registerTask('default', 'css2str jst concat min');

  // jam build.
  grunt.registerTask('amd', 'css2str jst concat min jam');

  // test
  grunt.registerTask('test', 'rmcouchdb:test mkcouchdb:test couchapp:test qunit');


};