(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory( require('async'), require('pouchdb'), require('garden-views'), require('url'), require('stately.js'));
    } else if (typeof define === 'function' && define.amd) {
        define(['async','pouchdb', 'garden-views', 'url', 'stately'],factory);
    } else {
        root.garden_dashboard_core = factory(root.async, root.Pouch, root.garden_views, root.url, root.stately);
    }
}(this, function (async, Pouch, garden_views, url, Stately) {

var app = {};
app = function(dashboard_db_url, options) {
    var thus = this;
    thus.dashboard_db_url = dashboard_db_url;
    thus.pouchName = app.getPouchName(dashboard_db_url);
};


app.prototype.init = function(callback) {
    var core = this;

};


app.prototype.sync = function(callback) {
    Pouch.replicate(this.remote_db, this.local_db, {}, callback);
};


app.prototype.allAssets = function(callback) {
    this.local_db.allDocs(callback);
};

app.prototype.settings = function(callback) {
  this.local_db.get('settings', function(err, data){
    if (err && err.status === 404) return callback(null, {});
    callback(err, data);
  });
};

app.prototype.topbar = function(callback) {
  var results = {
    settingsDoc : {},
    selectedThemeDoc : null,
    apps: [],
    scripts: []
  };

  this.local_db.query(garden_views.dashboard_assets, {reduce: false, include_docs: true}, function(err, resp){
    async.forEach(resp.rows, function(row, cb){
        if (row.key[0] === 0) results.settingsDoc = row.value;
        if (row.key[0] === 1) {
            if (row.key[3] == 'install') {
                results.apps.push({
                    title : row.key[2],
                    db :row.value.db,
                    doc : row.doc
                });
            }
            if (row.key[3] == 'link') {
                results.apps.push({
                    title : row.key[2],
                    link :row.value.url,
                    doc  : row.doc,
                    external : true
                });
            }
        }
        if (row.key[0] === 2) results.selectedThemeDoc = row.doc;
        if (row.key[0] === 3) results.scripts.push(row.doc.src);
        cb();
    }, function(err){
      callback(err, results);
    });
  });
};



app.getPouchName = function(dashboard_db_url) {

  var parsed = url.parse(dashboard_db_url),
      namespace = parsed.hostname + parsed.port;

  if (parsed.pathname) {
     var clean = parsed.pathname.replace(/\//g, '_');
     namespace += clean;
  }


  return namespace;
};






app.prototype.setupState = function() {
    var core = this;
    core.states = Stately({
        "OYHI": {
            determine_state : core.t_determine_state
        },
        "FIRST_VISIT" : {
            // couch available, pouch supported, never synced
            sync: core.t_first_sync
        },
        "OFFLINE_NO_HOPE" : {
            // no couch available, pouch supported, never synced
        },
        "READY_LOCAL_DB_UNSUPPORTED": {
            // couch available, pouch not supported
        },
        "READY_HAVE_LOCAL_DB_ONLINE" : {
            // pouch synced before
            // get user info from db, determines ONLINE_WITH_USER/ONLINE_WITHOUT_USER
        },
        "READY_HAVE_LOCAL_DB_OFFLINE" : {
            // pouch synced before
            // get user info from cache determines OFFLINE_WITH_USER/OFFLINE_WITHOUT_USER
        },

        "OFFLINE_WITH_USER" : {
            poll_connectivity : t_poll_connectivity,
            logout: t_logout
        },
        "OFFLINE_WITHOUT_USER" : {
           poll_connectivity : t_poll_connectivity,
           login: t_login
        },
        "ONLINE_WITH_USER" : {
           poll_connectivity : t_poll_connectivity,
           logout: t_logout
        },
        "ONLINE_WITHOUT_USER": {
           poll_connectivity : t_poll_connectivity,
           login: t_login
        }
    });
    return states;
};

app.prototype.t_determine_state = function() {
    var core = this;
    async({
        is_couch_available : core.is_couch_available,
        pouched_dashboard : core.pouched_dashboard
    }, function(err, info){
        if (err) {
            return core.states.setMachineState(core.states.READY_LOCAL_DB_UNSUPPORTED);
        }

        if (info.is_couch_available && !info.pouched_dashboard.synced) {
            return core.states.setMachineState(core.states.FIRST_VISIT);
        }
        if (info.is_couch_available && info.pouched_dashboard.synced) {
            return core.states.setMachineState(core.states.READY_HAVE_LOCAL_DB_ONLINE);
        }
        if (!info.is_couch_available && info.pouched_dashboard.synced) {
            return core.states.setMachineState(core.states.READY_HAVE_LOCAL_DB_OFFLINE);
        }
        if (!info.is_couch_available && !info.pouched_dashboard.synced) {
            return core.states.setMachineState(core.states.OFFLINE_NO_HOPE);
        }
    });
};

app.prototype.get_remote_session = function(callback) {
    this.remote_db.request({
        url: '_session'
    }, callback);
};

app.prototype.remote_dashboard = function(callback) {
    var core = this;
    Pouch(core.dashboard_db_url, function(err, db){
        core.remote_db = db;
        // we swallow errors
        var results = {
            db: db,
            available: false,
            session: null
        };
        if (err) return callback(null, results);

        core.get_remote_session(function(err, session){
            if (err) return callback(null, results);
            results.available = true;
            results.session = session;
            callback(null, results);
        });
    });
};

app.prototype.pouched_dashboard = function(callback) {
    // return pouch, and if it has been synced with a dashbaord
    Pouch(this.pouchName, function(err, db){
        if (err) return callback(err);
        core.local_db = db;
        db.info(function(err, info) {
            if (err) return callback(err);
            var results = {
                db : db,
                synced : false
            };
            if (info.doc_count > 0) results.synced = true;
            callback(null, results);
        });
    });
};
app.prototype.poll_connectivity = function(callback) {
    // che
};


app.prototype.t_first_sync = function() {
    var core = this;
    core.sync(function(err){
        if (err) return core.states.setMachineState(core.states.READY_LOCAL_DB_UNSUPPORTED);
        core.states.setMachineState(core.states.READY_HAVE_LOCAL_DB_ONLINE);
    });
};

app.prototype.method_name = function(first_argument) {
    // body...
};



return app;

}));