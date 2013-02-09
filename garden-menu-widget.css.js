(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.garden_menu_widget_css = factory();
    }
}(this, function () { return {



'#dashboard-topbar' : {
    'font-family': 'Helvetica Neue, Helvetica, Arial, sans-serif',
    'font-size': '13px',
    'font-weight': 'normal',
    'line-height': '18px',
    'color': '#404040',
    'height': '25px',
    'width': '100%',
    'background-color': 'black',
    'position': "relative"
  }

};  }));