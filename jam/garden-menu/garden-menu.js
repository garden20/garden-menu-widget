(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory( require('underscore'), require('garden-dashboard-core'), require('garden-default-settings'), require('url'));
    } else if (typeof define === 'function' && define.amd) {
        define(['underscore','garden-dashboard-core', 'garden-default-settings', 'url'],factory);
    } else {
        root.garden_menu = factory(root._, root.garden_dashboard_core, root.garden_default_settings, root.url);
    }
}(this, function (_, DashboardCore, default_settings, url) {

var app = function(dashboard_db_url, options) {
    this.dashboard_db_url = dashboard_db_url;
    this.options = options;
    this.dashboard_core = new DashboardCore(dashboard_db_url, options);

    // in case things are called out of order, fallback to default settings.
    this.settings = default_settings;

};

app.prototype.init = function(callback) {
    var menu = this;

    // some inital values
    var results = {
        core : menu.dashboard_core,
        state: 'OFFLINE_NO_HOPE',
        settings: null
    };

    menu.dashboard_core.start(function(err, state) {
        if (state === 'OFFLINE_NO_HOPE') return callback('OFFLINE_NO_HOPE', results);
        results.state = state;
        callback(null, results);
    });
};

app.prototype.getAppLinks = function(options, callback) {
    var menu = this;

    if (!callback) {
        callback = options;
        options = {};
    }

    menu.dashboard_core.topbar(function(err, results) {
        if (err) return callback(err);

        menu.settings = _.defaults(results.settingsDoc, default_settings);
        var settings = results.settingsDoc;

        results.dashboard_url = menu.dashboard_ui_url(),
        results.home_url = results.dashboard_url,
        results.settings_url  = results.dashboard_url + "settings";
        results.login_url = menu.login_url(results.dashboard_url);


        if (settings.frontpage.use_link) {
            results.home_url = settings.frontpage.link_url;
        }

        results.apps = _.map(results.apps, function(app) {
            if (app.db) {
                app.link = menu.app_url_ui(app.doc);
            }
            if (app.doc.remote_user && options.username && app.doc.remote_user !== username) {
                app.remote_user_warning = true;
                app.remote_user = app.doc.remote_user;
            }
            if (app.doc.kanso || app.doc.couchapp) {
                var meta = app.doc.couchapp || app.doc.kanso;
                app.desc = meta.config.description;
            }
            return app;
        });

        results.grouped_apps = _.groupBy(results.apps, function(app) {
            if (app.doc.onDropdownMenu) return "more_apps";
            else return "apps";
        });
        callback(null, results);
   });
};


app.prototype.login_url = function(dashboard_url) {
    var login_url = dashboard_url + 'login';

    if (this.settings.sessions.type == 'other') {
        login_url = this.settings.sessions.other.login_url;
    }
    return login_url;
};

app.prototype.dashboard_ui_url = function() {

    if (this.settings.host_options.rootDashboard) {
        // only if the current host matches one of the specified hosts
        var use_short = false;
        // dermine if we are on the server or browser
        if (typeof window !== 'undefined') {
            var host = window.location.host;
            var hostnames = this.settings.host_options.hostnames.split(',');
            _.each(hostnames, function(hostname){
                var p = url.parse(hostname);
                var to_bind = p.hostname;
                if (p.port != '80' && (_.isString(p.port) || _.isNumber(p.port)) ) {
                    to_bind += ':' + p.port;
                }
                if (to_bind == host) use_short = true;
            });
            if (use_short) return '/';
        }
    }
    return  '/dashboard/_design/dashboard/_rewrite/';
};


app.prototype.app_url_ui = function(app_install_doc) {
    var meta = app_install_doc.couchapp || app_install_doc.kanso;
    try {
        if (meta.config.legacy_mode) {
            return '/' + app_install_doc.installed.db + '/_design/' + app_install_doc.doc_id  + app_install_doc.open_path;
        }
    } catch(ignore){}

    if (typeof window !== 'undefined' && this.settings.host_options.short_urls && this.settings.host_options.short_app_urls) {

        // only if the current host matches one of the specified hosts
        var use_short = false;

        // dermine if we are on the server or browser
        var host = window.location.host;

        var hostnames = this.settings.host_options.hostnames.split(',');
        _.each(hostnames, function(hostname){
            var p = url.parse(hostname);
            var to_bind = p.hostname;
            if (p.port != '80' && (_.isString(p.port) || _.isNumber(p.port)) ) {
                to_bind += ':' + p.port;
            }
            if (to_bind == host) use_short = true;
        });
        if (use_short) return '/' + app_install_doc.installed.db + '/';
    }
    return '/' + app_install_doc.installed.db + '/_design/' + app_install_doc.doc_id  + app_install_doc.open_path;
};

app.prototype.app_settings_ui = function(app_install_doc) {
    if (this.settings.host_options.rootDashboard) {
        return '/settings#/apps/' + app_install_doc._id;
    }
    return '/dashboard/_design/dashboard/_rewrite/settings#/apps/' + app_install_doc._id;
};


return app;

}));