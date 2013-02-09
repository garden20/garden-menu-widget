(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('url'), require('garden-menu'));
    } else if (typeof define === 'function' && define.amd) {
        define(['url', 'garden-menu'],factory);
    } else {
        root.garden_menu_widget = factory(root.url, root.garden_menu);
    }
}(this, function (url, GardenMenu) {


var app = function(dashboard_db_url) {
    this.dashboard_db_url = dashboard_db_url;
    this.menu_core = new GardenMenu(dashboard_db_url);
};




app.prototype.init = function(callback) {
    var widget = this;
    widget.menu_core.init(function(err, settings){
        widget.menu_core.getAppLinks(function(err, links){
            console.log(err, links);
            callback(null);
        });
    });
};


return app;

}));