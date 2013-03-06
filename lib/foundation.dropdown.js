/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.dropdown = {
    name : 'dropdown',

    version : '4.0.0',

    settings : {
      activeClass: 'open'
    },

    init : function (scope, method, options) {
      this.scope = scope || this.scope;
      Foundation.inherit(this, 'throttle');

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      }

      if (typeof method != 'string') {

        if (!this.settings.init) {
          this.events();
        }

        return this.settings.init;
      } else {
        return this[method].call(this, options);
      }
    },

    events : function () {
      var self = this;

      $(this.scope).on('click.fndtn.dropdown', '[data-dropdown]', function (e) {
        e.preventDefault();
        e.stopPropagation();
        self.toggle($(this));
      });

      $('*, html, body').on('click.fndtn.dropdown', function (e) {
        if (!$(e.target).data('dropdown')) {
          $('[data-dropdown-content]')
            .css('left', '-99999px')
            .removeClass(self.settings.activeClass);
        }
      });

      $('[data-dropdown-content]').on('click.fndtn.dropdown', function (e) {
        e.stopPropagation();
      });

      $(window).on('resize.fndtn.dropdown', self.throttle(function () {
        self.resize.call(self);
      }, 50)).trigger('resize');

      this.settings.init = true;
    },

    toggle : function (target, resize) {
      var dropdown = $('#' + target.data('dropdown'));

      $('[data-dropdown-content]').not(dropdown).css('left', '-99999px');

      if (dropdown.hasClass(this.settings.activeClass)) {
        dropdown
          .css('left', '-99999px')
          .removeClass(this.settings.activeClass);
      } else {
        this
          .css(dropdown
            .addClass(this.settings.activeClass), target);
      }
    },

    resize : function () {
      var dropdown = $('[data-dropdown-content].open'),
          target = $("[data-dropdown='" + dropdown.attr('id') + "']");

      if (dropdown.length && target.length) {
        this.css(dropdown, target);
      }
    },

    css : function (dropdown, target) {
      var offset = target.offset();

      if (this.small()) {
        dropdown.css({
          position : 'absolute',
          width: '95%',
          left: '2.5%',
          'max-width': 'none',
          top: offset.top + this.outerHeight(target)
        });
      } else {
        var owc = this.outside_window_check(dropdown, target);

        dropdown.attr('style', '').css({
          position : 'absolute',
          top: offset.top + this.outerHeight(target),
          left: owc.left
        });

        dropdown.toggleClass('reverse', owc.reverse);

      }

      return dropdown;
    },

    outside_window_check : function(dropdown, target) {
      var offset = target.offset(),
          window_width = $(window).width(),
          dd_width = dropdown.width();

      if (offset.left + dd_width > window_width){
        return { left: window_width - dd_width, reverse: true };
      } else {
        return { left: offset.left, reverse: false};
      }

    },

    small : function () {
      return $(window).width() < 768 || $('html').hasClass('lt-ie9');
    },

    off: function () {
      $(this.scope).off('.fndtn.dropdown');
      $('html, body').off('.fndtn.dropdown');
      $(window).off('.fndtn.dropdown');
      $('[data-dropdown-content]').off('.fndtn.dropdown');
      this.settings.init = false;
    }
  };
}(Foundation.zj, this, this.document));
