var root_url = window.location,
    db = url.resolve(root_url, '/dashboard');


ui = new garden_menu_widget(db);
ui.init(function(err){
    console.log('init', err);
});
