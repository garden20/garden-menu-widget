asyncTest( "Load Topbar", function() {

    expect( 4 );

    ok(window.garden_ui, 'Global garden_ui varabile is set');

    garden_ui.on('loaded', function(){
        ok(true, 'Menu loaded');

        var count = $('#dashboard-topbar').length;
        ok((count === 1), 'There is a div created' );

        ok( ($('#dashboard-profile').children().length ===0), 'no profile showing');
        start();
    });
});