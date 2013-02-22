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
  "lib/url.js",
  "jam/async/lib/async.js",
  "jam/underscore/underscore.js",
  "jam/events/events.js",
  "jam/stately/Stately.js",
  "jam/svg/dist/svg.js",
  "jam/sync-status-icon/sync-status-icon.js",
  "lib/bowser.js",
  "lib/pouchdb-nightly.js",
  "lib/Modernizer.custom.js",
  "jam/garden-views/garden-views.js",
  "jam/garden-dashboard-core/garden-dashboard-core.js",
  "jam/garden-default-settings/garden-default-settings.js",
  "jam/garden-menu/garden-menu.js",

  "jam/jscss/lib/index.js",
  "jam/jquery/jquery.js",
  "jam/qTip2/dist/jquery.qtip.js",
  "temp/templates.js",
  "dist/compiled_css.js",
  "src/garden-menu-widget.css.js",
  "garden-menu-widget.js",
  "src/topbar.js"
];

var extraCss = [
  "jam/qTip2/dist/jquery.qtip.css"
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
          "<banner:meta.css.top>", "temp/css.json", "<banner:meta.css.bottom>"
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
      all: ['http://localhost:5984/garden_menu_widget/_design/gmw/index.html']
    }
  });

  grunt.loadNpmTasks('grunt-jam');
  grunt.loadNpmTasks('grunt-contrib-jst');
  // Load the couchapp task
  grunt.loadNpmTasks('grunt-couchapp');

  grunt.registerTask('css2json', 'My "asyncfoo" task.', function() {
    // Force task into async mode and grab a handle to the "done" function.
    var done = this.async();

    var full_css = {};

    grunt.util.async.forEach(extraCss, function(file, cb) {
      var basePath = path.join(__dirname, "jam/qTip2/dist/jquery.qtip.css");
      var css = fs.readFileSync(basePath, 'utf8');
      full_css = grunt.util._.extend(full_css, css2json(css));
      cb();
    }, function(){
      grunt.config.set('extraCss', full_css);
      try { fs.mkdirSync('temp'); } catch(ignore){}
      fs.writeFileSync('temp/css.json', 'return ' +  JSON.stringify(full_css) + ';');
      done();
    });
  });



  // Default task.
  grunt.registerTask('default', 'css2json jst concat min');

  // jam build.
  grunt.registerTask('amd', 'css2json jst concat min jam');

  // test
  grunt.registerTask('test', 'rmcouchdb:test mkcouchdb:test couchapp:test qunit');


};