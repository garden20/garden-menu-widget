this["JST"] = this["JST"] || {};

this["JST"]["templates/profile.underscore"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='';
 if (!is_user) { 
;__p+='\n    <a class="login" href="'+
(login_url)+
'">Login</a>\n';
 } else { 
;__p+='\n    <img src="http://www.gravatar.com/avatar/21232f297a57a5a743894a0e4a801fc3?size=20&amp;default=mm" alt="admin">\n    <h4>'+
( displayName )+
'</h4>\n\n';
 } 
;__p+='';
}
return __p;
};

this["JST"]["templates/topbar.underscore"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div class="topbar-right">\n    <div id="dashboard-topbar-offline-icon"></div>\n    <div id="dashboard-profile"></div>\n</div>\n<div class="topbar-middle">\n\n    <ul class="kanso-nav">\n\n        ';
 _.each(grouped_apps.apps, function(app) { 
;__p+='\n        <li>\n            <a href="'+
( app.link )+
'">'+
( app.title )+
'</a>\n        </li>\n        ';
 }) 
;__p+='\n    </ul>\n\n\n</div>\n';
}
return __p;
};