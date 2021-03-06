var root_url = window.location,
    db = url.resolve(root_url, '/dashboard'),
    // the hardcoded, pre agreed location of this script.
    baseJavascript = "/dashboard/_design/dashboard/_rewrite/static/js/topbar.js";


var queryOptions = findScriptParams();


window.garden_ui = new garden_menu_widget(db, queryOptions);
window.garden_ui.init(function(err){

});
$.noConflict(true);



// get querystring params from this
function findScriptParams() {
    var links = $('script');
    var results = {};
    $.each(links, function(i, script){
        var src = $(script).attr('src');
        if (src && src.indexOf(baseJavascript) === 0) {
            var param =  src.split('?')[1];
            console.log(param);
            if (param) {
                results = parseQueryString(param);
            }
        }
    });
    return results;
}


function parseQueryString(str){
  if ('string' != typeof str) return {};
  str = trim(str);
  if ('' === str) return {};
  return reduce(str.split('&'), function(obj, pair){
    var parts = pair.split('=');
    obj[parts[0]] = null === parts[1] ? '' : decodeURIComponent(parts[1]);
    return obj;
  }, {});
}

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

function reduce(arr, fn, initial){
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3 ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }

  return curr;
}
