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
'#dashboard-topbar' : {

    'font-weight': 'normal',

    'color': '#404040',
    'height': '25px',
    'width': '100%',
    'background': getTopbarBackground('#4a4c4d', '#2b2d2d'),
    'background-color': '#2b2d2d',
    'font-family': "titillium, ProximaNovaRgRegular, 'Helvetica Neue', helvetica, arial, sans-serif",
    'overflow': 'hidden',
    'z-index': '100'
},



'#dashboard-topbar .topbar-middle' : {
    'width' : '940px',
    'margin-left': 'auto',
    'margin-right': 'auto'
},

'#dashboard-topbar .topbar-right' : {
    'float': 'right'

},

'#dashboard-topbar a': {
    'text-decoration': 'none',
    'font-weight': 'normal'
},


'#dashboard-topbar ul': {
    'margin': '0',
    'padding': '0',
    'height': '25px',
    'overflow': 'hidden',
    'list-style-type': 'none'

},

'#dashboard-topbar ul>li': {
    'display': 'block',
    'float': 'left'
},

'#dashboard-topbar ul>li>a': {
    'display': 'block',
    'padding': '3px 10px 2px 10px',
    'color': '#BFBFBF',
    'font-weight': 'bold',
    'font-size': '14px',
    'line-height': '18px',
    'text-transform': 'capitalize',
    'text-shadow': '1px 1px 1px #111'
},

'#dashboard-topbar ul>li>a:hover': {
    'color': '#FFFFFF',
    'text-decoration': 'none'
},

'#dashboard-topbar ul>li.active>a.active' : {
    'border-top': '2px solid #1d1d1d !important',
    'color': '#FFF',
    'padding-top': '1px !important'
},

'#dashboard-topbar-offline-icon' : {
    'cursor': 'pointer',
    'padding': '0 3px',

    'width': '25px',
    'height': '25px',
    'float': 'left'
},

'#dashboard-topbar-offline-icon:hover' : {
    'background-color': '#4d4d4d'
},

'#dashboard-topbar-offline-icon svg' : {
    'margin-top': '2px'
    // 'position': 'relative',
    // 'top': '2px',
    // 'left': '2px'
},

'#dashboard-profile': {
    'display': 'inline-block',
    'padding': '0',
    'cursor': 'pointer',
    //'position': 'relative',
    'height': '25px',
    'float': 'right'
},


'#dashboard-profile:hover' : {
    'background-color': '#4d4d4d'
},

'#dashboard-profile img': {
    //'position': 'relative',
    'margin-top': '2px',
    'padding-left': '10px',
    'float': 'left'
},

'#dashboard-profile h4': {
    'display': 'inline-block',
    'margin': '0',
    //'position': 'relative',
    'font-family': '"Helvetica Neue", Helvetica, Arial, sans-serif',
    'font-size': '13px',
    'font-weight': 'normal',
    'line-height': '18px',
    'color': '#BFBFBF',
    'padding': '3px 10px 0 6px'
},


'#dashboard-topbar   a.login': {
    'display': 'block',
    'padding': '2px 10px 2px 10px',
    'color': '#ccc',
    'text-decoration': 'none',
    'height': '25px'
},

'#dashboard-topbar  a.login:hover': {
    'color': 'white',
    'text-decoration': 'none'
}


};  // end of css block


return function(options) {
    if (options.position) css['#dashboard-topbar'].position = options.position;
    return css;
};


}));