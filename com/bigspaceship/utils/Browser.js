/*
Copyright (C) 2010 Big Spaceship, LLC

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

To contact Big Spaceship, email info@bigspaceship.com or write to us at
45 Main Street #716, Brooklyn, NY, 11201.
*/

var Browser         =   new(function(){

    // private vars
    var _me         =   this;

    // public vars
    this.name       =   "Browser";

// ===========================================
// ===== CALLABLE
// ===========================================

    this.attach     =   function attach(){

    };

    this.detatch    =   function detatch(){

    };

    this.setClasses =   function setClasses(){
        if($.browser.msie)      $('body').addClass('is-ie');
        if($.browser.webkit)    $('body').addClass('is-webkit');
        if($.browser.opera)     $('body').addClass('is-opera');
        if($.browser.mozilla)   $('body').addClass('is-mozilla');
        if(navigator.userAgent.toString().indexOf('Chrome'))
            $('body').addClass('is-chrome');
        if( $.browser.safari &&
            !navigator.userAgent.toString().indexOf('Chrome'))
            $('body').addClass('is-safari');

        $('body').addClass( 'v-' + $.browser.version.toString().substring(0,1) );
    };


// ===========================================
// ===== CONSTRUCTOR
// ===========================================

    // constructor should immediately happen on doc load
    this.construct  =   function construct(){

    };

    // this is fired after all elements have been constructed
    this.init       =   function init(){
        _me.attach();
    };

    // register
    if(Main){
        Main.register(this);
    };

    return this;
})();


var userAgent = navigator.userAgent.toLowerCase();

// Figure out what browser is being used
jQuery.browser = {
    version: (userAgent.match( /.+(?:rv|it|ra|ie|me)[\/: ]([\d.]+)/ ) || [])[1],
    chrome: /chrome/.test( userAgent ),
    safari: /webkit/.test( userAgent ) && !/chrome/.test( userAgent ),
    opera: /opera/.test( userAgent ),
    msie: /msie/.test( userAgent ) && !/opera/.test( userAgent ),
    mozilla: /mozilla/.test( userAgent ) && !/(compatible|webkit)/.test( userAgent ),
    webkit: $.browser.webkit
};