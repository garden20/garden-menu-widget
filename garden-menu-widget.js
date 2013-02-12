(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('url'), require('garden-menu'));
    } else if (typeof define === 'function' && define.amd) {
        define(['url', 'garden-menu', 'jscss', './garden-menu-widget.css.js', 'modernizer'],factory);
    } else {
        root.garden_menu_widget = factory(
            root.url, root.garden_menu, root.jscss, root.garden_menu_widget_css, root.Modernizr, root.JST["templates/topbar.underscore"]);
    }
}(this, function (url, GardenMenu, jscss, css, Modernizr, topbar_t) {


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


function t(start_t, msg) {
    var now = new Date().getTime();
}

app.prototype.init = function(callback) {
    var widget = this;

    var time_s = new Date().getTime();
    widget.garden_menu.init(function(err, results){
        widget.garden_menu.getAppLinks(function(err, links){
            if (err) return callback(err);
            widget.loadTopbar(links, function(err){
                callback(err);
            });
        });
    });
};


app.prototype.loadTopbar = function(data, callback) {
    var $topbar = $('#dashboard-topbar');
    if ($topbar.length === 0) {
        $topbar = $('<div id="dashboard-topbar"></div>');
        $('body').prepend($topbar);
    }
    // check for other styles
    jscss.embed(jscss.compile(css));

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

    var login_base = $('#dashboard-topbar .login').attr('href');
    var full_login = login_base + "?redirect=" + encodeURIComponent(window.location);

    var sessionType = $('#dashboard-topbar-session').data('sessiontype');
    if (sessionType == 'other') {
        full_login = login_base +  "/" + encodeURIComponent(window.location);
    }

    $('#dashboard-topbar .login').attr('href', full_login);

    try {
        var userCtx = JSON.parse(decodeURI( $('#dashboard-topbar-session').data('userctx') ));
        var session = require('session');
        session.emit('change', userCtx);
    } catch(ignore){}

    // if we are on the login, set the class to active
    var fullPath = path + window.location.hash;
    if (fullPath.indexOf(login_base) === 0) {
        $('#dashboard-topbar-session').addClass('active');
        // add active to any ul
        $('#dashboard-topbar-session').find('ul li:first').addClass('active');
    }

    $('#dashboard-topbar').data('ready', true);
    $('#dashboard-topbar').trigger('ready');
    callback(null);
};


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

return app;

}));