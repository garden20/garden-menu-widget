asyncTest( "Load Topbar", function() {

    expect( 2 );

    ok(window.garden_ui, 'Global garden_ui varabile is set');

    garden_ui.on('dashboard-ready', function(){
        ok(true, 'Dashboard emits ready event');
        start();
    });
});