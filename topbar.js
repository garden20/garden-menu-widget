var root = window.location,
    db = url.resolve(root, '/dashboard');

ui = new garden_menu_widget(db);
ui.init(function(err){
    console.log('init', err);
});
