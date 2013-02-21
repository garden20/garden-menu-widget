var css2json = require('css2json'),
  fs = require('fs'),
  path = require('path');


/* ORDER HERE is _Very_ Important */
var srcFiles = [
  "lib/url.js",
  "jam/async/lib/async.js",
  "jam/underscore/underscore.js",
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
  "jam/jquery/jquery-1.9.1.min.js",
  "jam/qTip2/dist/jquery.qtip.js",
  "dist/templates.js",
  "dist/css.js",
  "garden-menu-widget.css.js",
  "garden-menu-widget.js",
  "topbar.js"
];

var extraCss = [
  "jam/qTip2/dist/jquery.qtip.css"
];


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
      all: ['garden-menu-widget.js']
    },
    jst: {
      compile: {
        files: {
          "dist/templates.js": ["templates/*.underscore"]
        }
      }
    },

    concat: {
      css: {
        src: grunt.utils._.flatten([
          "<banner:meta.css.top>", "dist/css.json", "<banner:meta.css.bottom>"
        ]),
        dest: 'dist/css.js'
      },
      all: {
        src: grunt.utils._.flatten([
          "<banner>","<banner:meta.inline.top>", srcFiles, "<banner:meta.inline.bottom>"
        ]),
        dest: 'dist/topbar.js'
      }
    },
    min: {
      dist: {
        src: "./dist/topbar.js",
        dest: 'dist/topbar.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jst');
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
      fs.writeFileSync('dist/css.json', 'return ' +  JSON.stringify(full_css) + ';');
      done();
    });
  });


  // Default task.
  grunt.registerTask('default', 'jst css2json concat min');

};