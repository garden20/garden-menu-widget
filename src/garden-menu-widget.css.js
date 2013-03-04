(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(['bowser'],factory);
    } else {
        root.garden_menu_widget_css = factory(root.bowser);
    }
}(this, function (bowser) {

function getTopbarBackground(from, to) {
    // also check version
    if (bowser.webkit) return '-webkit-linear-gradient('+from+','+to+')';
    if (bowser.opera ) return '-o-linear-gradient('+from+','+to+')';
    if (bowser.mozilla) return '-moz-linear-gradient('+from+','+to+')';
    return 'linear-gradient('+from+','+to+')';
}


var css =  {

// These are missing from the foundation css, but seem to be needed:

'#dashboard-topbar' : {
    'color': '#222222',
    'font-family': '"Helvetica Neue", "Helvetica", Helvetica, Arial, sans-serif',
    'font-weight': 'normal',
    'font-style': 'normal'
},


'.dashboard-topbar div, .dashboard-topbar dl, .dashboard-topbar dt, .dashboard-topbar dd, .dashboard-topbar ul, .dashboard-topbar ol, .dashboard-topbar li, .dashboard-topbar h1, .dashboard-topbar h2, .dashboard-topbar h3, .dashboard-topbar h4, .dashboard-topbar h5, .dashboard-topbar h6' : {
    'margin': '0',
    'padding': '0',
    'direction': 'ltr'
},

'#dashboard-topbar .top-bar-section .right': {
    'background-color': '#111111'
},

'#dashboard-topbar a' : {
  'text-decoration': 'none'
},
'#dashboard-topbar a img': {
    'border': 'none'
},


'#dashboard-topbar-offline-icon' : {
    'cursor': 'pointer',
    'padding': '0 3px',

    'width': '25px',
    'height': '25px',
    'float': 'left'
},

'#dashboard-topbar-offline-icon:hover' : {

},

'#dashboard-topbar-offline-icon svg' : {
    'margin-top': '2px',
    'shape-rendering': 'auto'
    // 'position': 'relative',
    // 'top': '2px',
    // 'left': '2px'
}


};  // end of css block


return function(options) {
    if (options.position) {
        //css['#dashboard-topbar'].position = options.position;
    }
    if (options.position === 'fixed') {
        //css['#dashboard-topbar'].top = "0";
    }
    return css;
};


}));