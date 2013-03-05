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
    'font-style': 'normal',
    'font-size': '16px',
    '-webkit-font-smoothing': 'antialiased',
    'text-shadow': 'none',
    'z-index': '10000'
},


'.dashboard-topbar div, .dashboard-topbar dl, .dashboard-topbar dt, .dashboard-topbar dd, .dashboard-topbar ul, .dashboard-topbar ol, .dashboard-topbar li, .dashboard-topbar h1, .dashboard-topbar h2, .dashboard-topbar h3, .dashboard-topbar h4, .dashboard-topbar h5, .dashboard-topbar h6' : {
    'margin': '0',
    'padding': '0',
    'direction': 'ltr'
},

'#dashboard-topbar .top-bar-section .right': {
    'background-color': '#111111',
    'position': 'absolute',
    'top': '0px',
    'right': '0px'
},

'#dashboard-topbar .top-bar.expanded .top-bar-section .right': {
    'background-color': '#333333',
    'position': 'relative'
},


'#dashboard-topbar a' : {
  'text-decoration': 'none',
  'text-shadow': 'none'
},
'#dashboard-topbar a img': {
    'border': 'none'
},


'#dashboard-topbar-offline-icon' : {
    'cursor': 'pointer',
    'padding': '0 5px',
    'height': '45px'

},

'#dashboard-topbar-offline-icon:hover' : {

},

'#dashboard-topbar-offline-icon svg' : {
    'margin-top': '12px',
    'shape-rendering': 'auto',

    // overcome some bootstrap stuff
    'width': 'auto'

    // 'position': 'relative',
    // 'top': '2px',
    // 'left': '2px'
},

'#dashboard-profile a.profile-link' : {
    'cursor': 'pointer',
    'height': '45px'
},

'#dashboard-profile a.profile-link img': {
    'float' : 'left',
    'top': '12px',
    'position': 'relative',
    'margin-right': '5px'
},

'#dashboard-profile a.profile-link span': {
    'float' : 'right'
}

};  // end of css block


return function(options) {
    if (options.position) {
        css['#dashboard-topbar'].position = options.position;
    }
    if (options.position === 'fixed') {
        css['#dashboard-topbar'].top = "0";
        css['#dashboard-topbar'].width = "100%";
        css['#dashboard-topbar']['z-index'] = "10000";
    }
    return css;
};


}));