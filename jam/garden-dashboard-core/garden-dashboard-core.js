(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory( require('async'), require('pouchdb'), require('garden-views'), require('url'), require('stately.js'));
    } else if (typeof define === 'function' && define.amd) {
        define(['async','pouchdb', 'garden-views', 'url'],factory);
    } else {
        root.garden_dashboard_core = factory(root.async, root.Pouch, root.garden_views, root.url, root.Stately);
    }
}(this, function (async, Pouch, garden_views, url, Stately) {

var app = function(dashboard_db_url, options) {
    var core = this;
    core.dashboard_db_url = dashboard_db_url;
    core.options = options;
    core.pouchName = app.getPouchName(dashboard_db_url);
    core.cached_session = null;

    /*------   Private Methods ------------------*/
    // any methods that start with t_ transition the state machine


    var initState = function() {
        core.states = Stately({
            "INIT": {
                start : t_determine_state
            },
            "FIRST_VISIT" : {
                // couch available, pouch supported, never synced
                poll: t_poll_connectivity_no_pouch,
                sync: t_first_sync,
                topbar: topbar_remote,
                allAssets: allAssets_remote,
                settings: settings_remote
            },
            "OFFLINE_NO_HOPE" : {
                // no couch available, pouch supported, never synced
            },
            "READY_LOCAL_DB_UNSUPPORTED": {
                // couch available, pouch not supported
                poll: t_poll_connectivity_no_pouch,
                topbar: topbar_remote,
                allAssets: allAssets_remote,
                settings: settings_remote
            },
            "OFFLINE_WITH_USER" : {
                poll : t_poll_connectivity,
                login: t_login,
                logout: t_logout,
                online: t_online,

                topbar: topbar_local,
                allAssets: allAssets_local,
                settings: settings_local
            },
            "OFFLINE_WITHOUT_USER" : {
                poll : t_poll_connectivity,
                login: t_login,
                logout: t_logout,
                online: t_online,
                topbar: topbar_local,
                allAssets: allAssets_local,
                settings: settings_local
            },
            "ONLINE_WITH_USER" : {
                poll : t_poll_connectivity,
                login: t_login,
                logout: t_logout,
                offline: t_offline,
                topbar: topbar_local,
                allAssets: allAssets_local,
                settings: settings_local
            },
            "ONLINE_WITHOUT_USER": {
                poll : t_poll_connectivity,
                login: t_login,
                logout: t_logout,
                offline: t_offline,
                topbar: topbar_local,
                allAssets: allAssets_local,
                settings: settings_local
            }
        });
    };

    var t_determine_state = function() {
        var self = this;

        async.parallel({
            remote_dashboard : remote_dashboard,
            pouched_dashboard : function(cb) {

                if (core.options.disablePouch) {
                    return cb(null, {unsupported: true});
                }
                try {
                    pouched_dashboard(function(err, results){
                        if (err) return cb(null, {unsupported: true});
                        cb (null, results);
                    });
                } catch(e) {
                    cb(null, {unsupported: true});
                }
            },
            pouched_extra : function(cb) {

                if (core.options.disablePouch) {
                    return cb(null, {unsupported: true});
                }
                try {
                    pouched_extra(function(err, results){
                        if (err) return cb(null, {unsupported: true});
                        cb (null, results);
                    });
                } catch(e) {
                    cb(null, {unsupported: true});
                }
            }


        }, function(err, info){
            if (err || info.pouched_dashboard.unsupported) {
                return self.setMachineState(self.READY_LOCAL_DB_UNSUPPORTED);
            }
            if (info.remote_dashboard.available) {

                if (!info.pouched_dashboard.synced) {
                    return self.setMachineState(self.FIRST_VISIT);
                }
                else {

                    get_stored_session(function(err, session){
                        if (is_session_logged_in(session)) {
                            return self.setMachineState(self.ONLINE_WITH_USER);
                        }
                        return self.setMachineState(self.ONLINE_WITHOUT_USER);
                    });
                }
            }
            if (!info.remote_dashboard.available && info.pouched_dashboard.synced) {

                get_stored_session(function(err, session){

                    if (err || !session) self.setMachineState(self.OFFLINE_WITHOUT_USER);
                    if (is_session_logged_in(session))  return self.setMachineState(self.OFFLINE_WITH_USER);
                    return self.setMachineState(self.OFFLINE_WITHOUT_USER);
                });

            }
            if (!info.remote_dashboard.available && !info.pouched_dashboard.synced) {
                return self.states.setMachineState(self.OFFLINE_NO_HOPE);
            }
        });
    };



    var get_remote_session = function(callback) {
        core.remote_db.request({
            url: '../_session'
        }, callback);
    };

    var is_session_logged_in = function(session) {
        if (!session) return false;
        if (!session.userCtx) return false;
        if (!session.userCtx.name) return false;
        return true;
    };

    var store_session = function(session, callback) {
        if (!session) session = {userCtx: null};
        get_stored_session(function(err, stored_session){
            var update = true;
            if (err || !stored_session) stored_session = session;
            else {
                if (stored_session.userCtx.name === session.userCtx.name) {
                    update = false;
                }
                stored_session.userCtx = session.userCtx;
            }
            stored_session._id = 'session';
            if (update) {
                core.extra_db.put(stored_session, callback);
                core.cached_session = stored_session;
            }
            else callback(null, stored_session);
        });

    };

    var get_stored_session = function(callback) {
        core.extra_db.get('session', function(err, session){
            callback(err, session);
        });
    };


    var remote_dashboard = function(callback) {
        Pouch(core.dashboard_db_url, function(err, db){
            core.remote_db = db;
            // we swallow errors
            var results = {
                db: db,
                available: false,
                session: null
            };
            if (err) return callback(null, results);
            get_remote_session(function(err2, session){
                if (err2) return callback(null, results);
                core.cached_session = session;
                results.session = session;
                results.available = true;
                callback(null, results);
            });

        });

    };

    var pouched_dashboard = function(callback) {
        // return pouch, and if it has been synced with a dashbaord


        try {
            Pouch(core.pouchName, function(err, db){
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
        } catch (e) {
            return callback(null, {unsupported: true});
        }
    };

    var pouched_extra = function(callback) {
        // return pouch, and if it has been synced with a dashbaord
        Pouch('dashbaord_extra', function(err, db){
            if (err) return callback(err);
            core.extra_db = db;
            callback(null, db);
        });
    };


    var t_poll_connectivity = function() {
        var self = this;

        get_remote_session(function(err, session){
            if (err) {
                // offline
                get_stored_session(function(err, session){
                    if (is_session_logged_in(session)) return self.setMachineState(self.OFFLINE_WITH_USER);
                    else return self.setMachineState(self.OFFLINE_WITHOUT_USER);
                });
            } else {
                // online
                store_session(session, function(err2) {
                    if (is_session_logged_in(session)) return self.setMachineState(self.ONLINE_WITH_USER);
                    else return self.setMachineState(self.ONLINE_WITHOUT_USER);
                });
            }
        });
    };

    var t_poll_connectivity_no_pouch = function() {
        var self = this;
        get_remote_session(function(err, session){
            if (err) return;
            core.cached_session = session;
            //trigger an update
            var state = self.getMachineState();
            self.setMachineState(self[state]);
        });
    };


    var t_first_sync = function() {
        var self = this;
        sync(function(err){
            if (err) return self.setMachineState(self.READY_LOCAL_DB_UNSUPPORTED);

            get_stored_session(function(err, session){
                if (err || !session) self.setMachineState(self.ONLINE_WITHOUT_USER);
                if (is_session_logged_in(session))  return self.setMachineState(self.ONLINE_WITH_USER);
                return self.setMachineState(self.ONLINE_WITHOUT_USER);
            });

        });
    };

    var sync = function(callback) {
        Pouch.replicate(core.remote_db, core.local_db, { filter: 'dashboard/docs_only' }, callback);
    };


    var t_login = function(user, password, callback) {
        // body...
    };

    var t_logout = function(callback) {

    };

    var t_online = function(callback) {

    };

    var t_offline = function(callback) {

    };

    var topbar_local = function(callback) {
        core.local_db.query(garden_views.dashboard_assets, {reduce: false, include_docs: true}, function(err, resp){
            topbar_process(err, resp, callback);
        });
    };

    var topbar_remote = function(callback) {
        core.remote_db.query('dashboard/dashboard_assets', {reduce: false, include_docs: true}, function(err, resp){
            topbar_process(err, resp, callback);
        });
    };

    var topbar_process = function(err, resp, callback) {
        var results = {
            settingsDoc : {},
            selectedThemeDoc : null,
            apps: [],
            scripts: []
        };
        // there is no db
        if (err && err.status === 404 && err.reason === 'no_db_file') return topbar_empty(results, callback);
        // the design doc is not there...
        if (err && err.status === 404 && err.reason === 'missing') return topbar_empty(results, callback);
        if (err) return callback(err);
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
    };

    var topbar_empty = function(results, callback) {
        results.no_db_file = true;
        callback(null, results);
    };

    var allAssets_local = function(callback) {
        core.local_db.allDocs(callback);
    };

    var allAssets_remote = function(callback) {
        core.remote_db.allDocs(callback);
    };

    var settings_local = function(callback) {
        core.local_db.get('settings', function(err, data){
            if (err && err.status === 404) return callback(null, {});
            callback(err, data);
        });
    };

    var settings_remote = function(callback) {
        core.remote_db.get('settings', function(err, data){
            if (err && err.status === 404) return callback(null, {});
            callback(err, data);
        });
    };

    initState();
};


/* --------- Public API  -------------------*/
// all proxy to the statemachine for the right action
// based on online/offline

app.prototype.start = function(callback) {
    var self = this;

    var onState = function(event, oldState, newState) {
        if (newState === 'INIT') return;
        self.states.unbind(onState);
        callback(null, newState);
    };
    self.states.bind(onState);
    self.states.start();
};

app.prototype.sync = function(callback) {
    this.states.sync(callback);
};

app.prototype.topbar = function(callback) {
    this.states.topbar(callback);
};

app.prototype.allAssets = function(callback) {
    this.states.allAssets(callback);
};

app.prototype.settings = function(callback) {
    this.states.settings(callback);
};

app.prototype.poll = function() {
    this.states.poll();
};

app.prototype.login = function(user, password, callback) {
    this.states.login(user, password, callback);
};

app.prototype.logout = function() {
    this.states.logout();
};

app.prototype.go_online = function() {
    this.states.online();
};

app.prototype.go_offline = function() {
    this.states.offline();
};

app.prototype.getState = function() {
    return this.states.getMachineState();
};

app.prototype.bind = function(func) {
    this.states.bind(func);
};

app.prototype.getCachedSession = function(callback) {
    var core = this;
    if (core.cached_session) {
        return callback(null, core.cached_session);
    }

    this.extra_db.get('session', function(err, session){
        if (err && err.status === 404) {
            // a special condition for the first time
            return callback(null, core.cached_session);
        }
        return callback(err, session);
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




return app;

}));