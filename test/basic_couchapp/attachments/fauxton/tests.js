asyncTest( "Load Topbar", function() {

    expect( 6 );

    ok(window.garden_ui, 'Global garden_ui varabile is set');

    garden_ui.on('loaded', function(){
        ok(true, 'Menu loaded');

        var count = $('#dashboard-topbar').length;
        ok((count === 1), 'There is a div created' );

        ok( $('#dashboard-topbar .top-bar .name h1 a').text() === 'CouchDB', 'The default title');
        ok( $('.dashboard-topbar .top-bar-section ul li.active a').text() === 'fauxton', 'Should be fauxton'  );


        ok( ($('.fauxton_link').length ===0 ), 'fauxton should not be shown');

        start();
    });
});