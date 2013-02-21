(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('url'), require('garden-menu'));
    } else if (typeof define === 'function' && define.amd) {
        define(['jquery', 'url', 'garden-menu', 'jscss', './garden-menu-widget.css.js', './dist/css.js','modernizer', 'sync-status-icon', 'svg'],factory);
    } else {
        root.garden_menu_widget = factory(
            root.jQuery,
            root.url, root.garden_menu, root.jscss,
            root.garden_menu_widget_css, root.garden_menu_widget_extra_css,
            root.Modernizr, root.svg,
            root.SyncIcon, root.JST["templates/topbar.underscore"], root.JST["templates/profile.underscore"]);
    }
}(this, function ($, url, GardenMenu, jscss, css, extra_css, Modernizr, svg, SyncIcon, topbar_t, profile_t) {


var app = function(dashboard_db_url) {
    this.dashboard_db_url = dashboard_db_url;

    var options = {
        disablePouch: true
    };
    if (Modernizr.indexeddb || Modernizr.websqldatabase) {
        options.disablePouch = false;
    }

    // also check version
    if (bowser.firefox && bowser.version < 12) {
        options.disablePouch= true;
    }
    if (bowser.opera && bowser.version < 12) {
        options.disablePouch= true;
    }
    if (bowser.chrome && bowser.version < 19) {
        options.disablePouch= true;
    }
    if (bowser.safari && bowser.version <= 5) {
        options.disablePouch= true;
    }
    if (bowser.iphone && bowser.version <= 5) {
        options.disablePouch= true;
    }

    this.garden_menu = new GardenMenu(dashboard_db_url, options);
};


app.prototype.init = function(callback) {
    var widget = this;
    widget.last_state = null;
    widget.garden_menu.init(function(err, results){


        widget.core = results.core;
        widget.garden_menu.getAppLinks(function(err, links){

            if (err) return callback(err);
            widget.loadTopbar(links, function(err){

                widget.cachedLinks = links;
                widget.core.getCachedSession(function(err, session){
                    widget.last_user = session.userCtx.name;
                    widget.showSession(session);
                });

                widget.poll_interval = setInterval(function() { widget.poll(); }, 5000);
                callback(err);
            });
        });
    });
};


app.prototype.poll = function() {
    this.core.poll();
};

app.prototype.loadTopbar = function(data, callback) {
    var me = this;

    // check for other styles
    jscss.embed(jscss.compile(css));
    jscss.embed(jscss.compile(extra_css));

    var $topbar = $('#dashboard-topbar');
    if ($topbar.length === 0) {
        $topbar = $('<div id="dashboard-topbar"></div>');
        $('body').prepend($topbar);
    }


    $topbar.html(topbar_t(data));
    var path = window.location.pathname;

    // highlight the best thing
    var dash = $topbar.find('a.home').attr('href');
    if (dash == path)  $topbar.find('a.home').addClass('active');

    var login = $topbar.find('#dashboard-topbar-session a').attr('href');
    if (login == path)  $topbar.find('#dashboard-topbar-session').addClass('active');


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


    $('#dashboard-topbar .username').click(function() {
        $('#dashboard-profile').toggle();
        $(document).one('click', function() {
            $('#dashboard-profile').hide();
        });
        return false;
    });

    $('#dashboard-topbar .logout').click(logout);

    $('#dashboard-topbar').data('ready', true);
    $('#dashboard-topbar').trigger('ready');

    me.sync_icon = new SyncIcon('dashboard-topbar-offline-icon', {
        size: 21,
        state: mapCoreStatesToDisplay(me.core.getState())
    });

    $('#dashboard-topbar a[title]').qtip({
        show: {
            delay: 2000
        },
        position: {
            at: 'bottom center'
        }
    });

    me.core.bind(function(event, old_state, new_state) {
        // filter some chaff
        if ((old_state !== 'FIRST_VISIT' && new_state !=='FIRST_VISIT') && (me.last_state === new_state)) return;


        // show the sync state
        var display_state = mapCoreStatesToDisplay(new_state);
        if (new_state === 'FIRST_VISIT' && me.sync_icon.getState() === 'syncing') {
            // not sure... for now do nothing...
        } else {
            me.sync_icon[display_state]();
        }

        me.core.getCachedSession(function(err, session){
            if (session.userCtx.name === me.last_user) return;
            me.showSession(session);
            me.last_user = session.userCtx.name;
        });


        me.last_state = new_state;
    });


    me.sync_icon.click(function(){
        var state = me.core.getState();
        if (state === 'FIRST_VISIT') {
            me.sync_icon.syncing();
            me.core.sync();
        }
    });

    callback(null);
};


app.prototype.showSession = function(session) {


    session.is_user = (session.userCtx.name || false);

    session.displayName = session.userCtx.name;
    session.login_url = this.cachedLinks.login_url;

    session.login_url = session.login_url + "?redirect=" + encodeURIComponent(window.location);

    $('#dashboard-profile').html(profile_t(session));
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
    $.ajax({
        url : '/dashboard/_design/dashboard/_rewrite/_couch/_session',
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
            alert('error loging out.');
        }
     });
    return false;
}


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

/**
 *  does a head check to the db. before allowing the link to pass.
 * This double checks the user can login to the link.
 * THis is to prevent the dreaded json error.
 * @param link
 */
function addNotLoggedInHack(link) {
    var db = link.data('db');
    if (db) {
        $(link).bind('click', function(){
           $(this).removeClass('hover');
            var pass;
            $.ajax({
                url : '/dashboard/_design/dashboard/_rewrite/_couch/' + db,
                 type: 'HEAD',
                 dataType: 'json',
                 async: false,
                 success: function(data){
                        pass = true;
                 },
                 error  : function() {
                    pass = false;
                    console.log('Access Denied');
                    //humane.error('Access Denied.');
                 }

             });
            return pass;

        });
    }
}


return app;

}));