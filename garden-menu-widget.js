(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([
            'jquery',
            'underscore',
            'events',
            'url',
            'garden-menu',
            'jscss',
            './src/garden-menu-widget.css.js',
            './dist/compiled_css.js',
            'modernizer',
            'bowser',
            'svg',
            'sync-status-icon'
        ],factory);
    } else {
        root.garden_menu_widget = factory(
            root.Zepto,
            root._,
            root.events,
            root.url,
            root.garden_menu,
            root.garden_default_settings,
            root.jscss,
            root.garden_menu_widget_css,
            root.garden_menu_widget_extra_css,
            root.Modernizr,
            root.bowser,
            root.svg,
            root.SyncIcon,
            root.gravatar,
            root.JST["templates/topbar.underscore"],
            root.JST["templates/profile.underscore"],
            root.JST["templates/profile_drop.underscore"]
        );
    }
}(this, function ($, _, events, url, GardenMenu, garden_settings, jscss, css, extra_css, Modernizr, bowser, svg, SyncIcon, gravatar, topbar_t, profile_t, profile_drop_t) {


var foundation = null;

var app = function(dashboard_db_url, options) {
    if (!options) options = {};
    this.dashboard_db_url = dashboard_db_url;

    var defaults = {};

    // adjust defaults for pouch based on env
    if (Modernizr.indexeddb || Modernizr.websqldatabase) {
        defaults.disablePouch = false;
    }
    // also check version
    if (bowser.firefox && bowser.version < 12) {
        defaults.disablePouch= true;
    }
    if (bowser.opera && bowser.version < 12) {
        defaults.disablePouch= true;
    }
    if (bowser.chrome && bowser.version < 19) {
        defaults.disablePouch= true;
    }
    if (bowser.safari && bowser.version <= 5) {
        defaults.disablePouch= true;
    }
    if (bowser.iphone && bowser.version <= 5) {
        defaults.disablePouch= true;
    }

    this.options = _.extend(defaults, options);
    this.emitter = new events.EventEmitter();
    this.garden_menu = new GardenMenu(dashboard_db_url, this.options);
};


app.prototype.init = function(callback) {
    var widget = this;
    widget.last_state = null;
    widget.garden_menu.init(function(err, results){


        widget.core = results.core;
        widget.garden_menu.getAppLinks(function(err, links){

            if (err) return callback(err);

            widget.links = links;
            // the final merge. Priority ends up (from highest to lowest)
            //   1. The db settings doc
            //   2. Any options passed into the new garden-menu-widget(...,options)
            //   3. The garden-default-settings js module
            widget.finalSettings = {};
            _.extend(widget.finalSettings, garden_settings.top_nav_bar, links.settingsDoc.top_nav_bar, widget.options);

            widget.loadTopbar(links, function(err){

                if (widget.finalSettings.showSession) {
                    widget.cachedLinks = links;
                    widget.core.getCachedSession(function(err, session){
                        widget.last_user = session.userCtx.name;
                        widget.showSession(session);
                    });

                    widget.poll_interval = setInterval(function() { widget.poll(); }, 10000);
                }

                callback(err);
            });
        });
    });
};


app.prototype.poll = function() {
    this.core.poll();
};

// emitter things..
app.prototype.on = function(event, listener) {
    this.emitter.on(event, listener);
};

app.prototype.once = function(event, listener) {
    this.emitter.once(event, listener);
};

app.prototype.removeListener = function(event, listener) {
    this.emitter.removeListener(event, listener);
};


app.prototype.loadTopbar = function(data, callback) {
    var me = this;



    jscss.embed(extra_css);

    // the computed styles always win
    jscss.embed(jscss.compile(css(me.finalSettings)));

    var $topbar = $('#dashboard-topbar');
    if ($topbar.length === 0) {
        $topbar = $('<div id="dashboard-topbar"></div>');
        $(me.finalSettings.divSelector).prepend($topbar);
    }

    // for the new foundation prefixed stuff
    $topbar.addClass('dashboard-topbar');

    if(data.apps.length === 0 && data.no_db_file && me.finalSettings.defaultAppName) {
        // show an *app* at the current url. Useful for non loaded gardens!
        data.defaultApp = {
            link: window.location.pathname,
            title: me.finalSettings.defaultAppName
        };
    }

    $topbar.html(topbar_t({data: data, options: me.finalSettings } ));

    try {
        $(document).foundation();
        foundation = $(document).foundation;
    } catch(e) {
        // so hacky. Depending how the user did the scripts, foundation might be
        // bound to jquery on the window scope
        window.$(document).foundation();
        foundation = window.$(document).foundation;
    }

    var path = window.location.pathname;

    // current futon hack. Remove when fauxton is ready
    if (path.indexOf('/_utils/') === 0) {
        $('#footer').css('bottom', '20px');
    }



    // highlight the best thing
    var dash = $topbar.find('a.home').attr('href');
    if (dash == path)  $topbar.find('a.home').addClass('active');

    var login = $topbar.find('#dashboard-topbar-session a').attr('href');
    if (login == path)  $topbar.find('#dashboard-topbar-session').addClass('active');

    /**
     *  does a head check to the db. before allowing the link to pass.
     * This double checks the user can login to the link.
     * THis is to prevent the dreaded json error.
     * @param link
     */
    var addNotLoggedInHack = function(link) {
        var db = link.data('db');
        if (db) {

            // only if online check the head
            $(link).bind('click', function(){
                var state = me.core.getState();
                if (state.indexOf('OFFLINE') === 0) return true;

               $(this).removeClass('hover');
                var pass;
                $.ajax({
                    url : '/dashboard/_design/dashboard/_rewrite/_couch/' + db,
                     type: 'HEAD',
                     dataType: 'json',
                     cache: "false",
                     async: false,
                     success: function(data, a){
                        pass = true;
                     },
                     error  : function(err, b, c) {
                        pass = false;
                        app.log('Access Denied.', {type: 'error'});
                     }

                 });
                return pass;

            });
        }
    };

    $('#dashboard-topbar ul.kanso-nav li').each(function(i) {
        var link = $(this).find('a');
        var href = link.attr('href');
        if ($(this).hasClass('home')) {
            if (href == path){
                $(this).addClass('active');
                link.addClass('active');
            }
        } else {
            if (path.indexOf(href) === 0) {
                $(this).addClass('active');
                link.addClass('active');
            }
            addNotLoggedInHack(link);
        }
    });

    $('#dashboard-topbar a').each(function(){
        var $a = $(this);
        var href = $a.attr('href');
        if ((path.indexOf(href) === 0 ) && ($a.data('remote_user_warn')) ){
            var remote_user = $a.data('remote_user');
            setTimeout(function(){
                if(confirm('Warning: The recommended user for this db is '+remote_user+'. Do you want to login as that user?')) {
                    window.location = $('#dashboard-topbar-session').data('login') + "?redirect=" + encodeURIComponent(window.location) + '&user=' + encodeURIComponent(remote_user);
                }
            }, 10);
        }
    });

    $('#dashboard-topbar .more-apps').click(function(){
        var me = $(this);
        var menu = $('#dashboard-more-apps');

        var left = me.position().left;
        menu.css('left', left + 'px').toggle(0, function(){
            if (menu.is(':visible')) me.addClass('dashboard-menu-highlight');
            else me.removeClass('dashboard-menu-highlight');
        });
        $(document).one('click', function() {
            me.removeClass('dashboard-menu-highlight');
            $('#dashboard-more-apps').hide();
        });
        return false;
    });



    $('#dashboard-topbar .logout').live('click', logout);

    $('#initGarden-drop button').live('click', function(){ me.initGarden(); });



    if (!me.finalSettings.disablePouch && !data.no_db_file) {
        // add a sync icon
        me.sync_icon = new SyncIcon('dashboard-topbar-offline-icon', {
            size: 21,
            state: mapCoreStatesToDisplay(me.core.getState())
        });
    } else {
        $('#dashboard-topbar-offline-icon').hide();
    }

    // bind state changes.
    me.core.bind(function(event, old_state, new_state) {
        // filter some chaff
        if ((old_state !== 'FIRST_VISIT' && new_state !=='FIRST_VISIT') && (me.last_state === new_state)) return;


        if (me.sync_icon) {
            // show the sync state
            var display_state = mapCoreStatesToDisplay(new_state);
            if (new_state === 'FIRST_VISIT' && me.sync_icon.getState() === 'syncing') {
                // not sure... for now do nothing...
            } else {
                me.sync_icon[display_state]();
            }
        }

        me.core.getCachedSession(function(err, session){
            if (session.userCtx.name === me.last_user) return;
            me.showSession(session);
            me.last_user = session.userCtx.name;
        });
        me.last_state = new_state;
    });

    // on click on sync icon
    $('#dashboard-topbar-offline-icon').click(function(){
        var state = me.core.getState();
        if (state === 'FIRST_VISIT') {
            me.sync_icon.syncing();
            me.core.sync();
        }
    });


    if (callback) callback(null);
    $topbar.data('ready', true);
    this.emitter.emit('loaded');
};


app.prototype.showSession = function(session) {


    session.is_user = isUser(session.userCtx);
    session.is_admin = isAdmin(session.userCtx);
    session.is_admin_party = isAdminParty(session.userCtx);

    session.displayName = session.userCtx.name;
    session.login_url = this.cachedLinks.login_url;

    session.login_url = session.login_url + "?redirect=" + encodeURIComponent(window.location);




    if (session.is_user || session.is_admin) {
        var grav = {
            email: session.userCtx.name,
            size: 20,
            default_image: 'retro'
        };
        session.gravatar_small = gravatar.avatarURL(grav);
        grav.size = 80;
        session.gravatar_large = gravatar.avatarURL(grav);

        $('#profile-drop').html(profile_drop_t(session));
    }
    $('#dashboard-profile').html(profile_t(session));

    var show_admin = session.is_admin || session.is_admin_party;


    $('#dashboard-topbar .admin_only').toggle(show_admin);

};



function mapCoreStatesToDisplay(core_state) {
        if (core_state === 'FIRST_VISIT') return "disabled";
        if (core_state === 'OFFLINE_NO_HOPE') return "disabled";
        if (core_state === 'READY_LOCAL_DB_UNSUPPORTED') return "disabled";
        if (core_state === 'OFFLINE_WITH_USER') return "offline";
        if (core_state === 'OFFLINE_WITHOUT_USER') return "offline";
        if (core_state === 'ONLINE_WITH_USER') return "online";
        if (core_state === 'ONLINE_WITHOUT_USER') return "online";
}


function logout() {
    // only if online


    $.ajax({
        url : '/_session',
        type: 'DELETE',
        dataType: 'json',
        success: function(){
            var isOkToReload = checkLogoutDestination();
            if (isOkToReload) {
                window.location.reload();
            } else {
                window.location = $('#dashboard-topbar-session').data('login');
            }
        },
        error  : function() {
            app.alert('error loging out.');
        }
     });
    return false;
}


app.prototype.initGarden = function() {
    var widget = this,
        $btn = $('#initGarden-drop button');

    if ($btn.data('available')) {
        window.location = widget.links.settings_url;
        return false;
    }
    $btn.attr('disabled', 'disabled').text('Please wait');

    $.ajax({
        url : '/_replicate',
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            source: garden_settings.top_nav_bar.dashboard_seed,
            target: 'dashboard',
            create_target: true
        }),
        error    : function() {
            app.log('Enabling Apps Failed', 'error');
        },
        success: function(){
            widget.initGardenComplete();
        }
     });
    return false;
};

app.prototype.initGardenComplete = function() {
    var widget = this;
    widget.garden_menu.getAppLinks(function(err, links){
        if (err) return app.log('Enabling Apps Failed', 'error');
        widget.links  = links;
        app.log('Apps enabled');
        $('#initGarden-drop button')
            .removeAttr('disabled')
            .data('available', true)
            .text('See Apps');
    });
};


function checkLogoutDestination() {
    var pass;
    $.ajax({
        url : window.location,
        type: 'HEAD',
        async: false,
        success: function(data){
            pass = true;
        },
        error  : function() {
            pass = false;
        }

    });
    return pass;
}


function isAdmin(userCtx) {
    if (!userCtx) return false;
    if (!userCtx.name) return false;
    if (!userCtx.roles) return false;
    if (userCtx.roles.indexOf('_admin') === -1) return false;

    return true;
}

function isAdminParty(userCtx) {
    if (!userCtx) return false;
    if (!userCtx.roles) return false;
    if (userCtx.name) return false;

    if (userCtx.roles.indexOf('_admin') === -1) return false;

    return true;
}


function isUser(userCtx) {
    if (!userCtx) return false;
    if (!userCtx.name) return false;
    return true;
}


// stuff for notifications
app.log = function(msg, options) {
    var type = 'success';
    if (options && options.type) type = options.type;

   window.Alertify.log[type](msg);
};

app.alert = function(msg, options) {
    window.Alertify.dialog.alert(msg);
};


return app;

}));