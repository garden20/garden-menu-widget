asyncTest( "Load Topbar", function() {

    expect( 2 );

    ok(window.garden_ui, 'Global garden_ui varabile is set');

    garden_ui.on('loaded', function(){
        ok(true, 'Menu loaded');
        start();
    });
});