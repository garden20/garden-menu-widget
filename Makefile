production :
	jam compile -i ./garden-menu-widget  -o dist/garden-menu-widget.dist.js; grunt; erica push http://admin:admin@localhost:5984/test_menu;
