asyncTest( "Load Topbar", function() {

    expect( 1 );
    $(function(){
        ok(window.garden_ui, 'Global garden_ui varabile is set');
        $(document).on('dashboard-ready', function(){
            console.log('adasdas');
            var $topbar = $('#dashboard-topbar');
            //ok($topbar.length === 1, 'Topbar loaded');
        });
    });
    start();

});