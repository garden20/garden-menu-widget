

/* ORDER HERE is _Very_ Important */
var srcFiles = [
  "lib/url.js",
  "jam/async/lib/async.js",
  "jam/underscore/underscore.js",
  "lib/pouchdb-nightly.js",
  "jam/garden-views/garden-views.js",
  "jam/garden-dashboard-core/garden-dashboard-core.js",
  "jam/garden-default-settings/garden-default-settings.js",
  "jam/garden-menu/garden-menu.js",

  "jam/jscss/lib/index/js",
  "garden-menu-widget.js",
  "topbar.js"
];


module.exports = function(grunt) {


  // Project configuration.
  grunt.initConfig({
    meta: {
      banner:"/*Garden Topbar*/",
      inline:{
        top : "(function() { ",
        bottom : " })();"
      }
    },
    lint: {
      all: ['garden-menu-widget.js']
    },
    concat: {
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
  // Default task.
  grunt.registerTask('default', 'lint concat min');

};