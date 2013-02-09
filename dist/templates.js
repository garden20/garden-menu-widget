this["JST"] = this["JST"] || {};

this["JST"]["templates/topbar.underscore"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='';
 _.each(grouped_apps.apps, function(app) { 
;__p+='\n\n<a href="'+
( app.link )+
'">\n'+
( app.title )+
'\n</a>\n';
 }) 
;__p+='\n';
}
return __p;
};