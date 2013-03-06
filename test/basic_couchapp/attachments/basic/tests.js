asyncTest( "Load Topbar", function() {

    expect( 5 );

    ok(window.garden_ui, 'Global garden_ui varabile is set');

    garden_ui.on('loaded', function(){
        ok(true, 'Menu loaded');

        var count = $('#dashboard-topbar').length;
        ok((count === 1), 'There is a div created' );

        ok( $('#dashboard-topbar .top-bar .name h1 a').text() === 'Garden', 'The name is customizable from the script url');
        ok( $('.dashboard-topbar .top-bar-section ul li.active a').text() === 'Splenda', 'A default app is created'  );



        start();
    });
});