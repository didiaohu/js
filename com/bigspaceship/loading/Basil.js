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

if(!Basil){

    /**
    * Basil
    *
    * This is the global loader for all javascript files.
    *
    * @version  1.0
    * @author   Matt Kenefick <m.kenefick@bigspaceship.com>
    * @package  Big Spaceship / Loading
    */
    function Basil($name){

        // private vars
        var _self = _me     =   this;
        var _include        =   [];
        var _included       =   [];
        var _classes        =   [];
        var _extensions     =   {};
        var _isComplete     =   false;

        // public vars
        this.name           =   $name || 'Basil';


    // ===========================================
    // ===== CALLABLE
    // ===========================================

        this.forceComplete  =   function forceComplete(){
            _includeComplete();
        };

        this.flush          =   function flush(){
            Out.debug(_self, "Flushing " + _self.name + " includes.");

            _include        =   [];
            _included       =   [];
            _classes        =   [];
        };

        this.register       =   function register($class){
            _classes.push($class);
        };

        this.extend         =   function extend($classA, $classB){
            Out.debug("Extending " + $classA.name + " with " + $classB );
            _extensions[$classA.name]   =   $classB;
        };

        this.include        =   function include($file){
            if(_isDuplicateInclude($file)){
                Out.warning(_self, "Already included: " + $file);
                return;
            };

            // save
            _include.push($file);
            Out.debug(_me, "Including: " + $file);

            $.ajax({
                contentType:        'text/javascript',
                dataType:           'script',
                url:                $file,
                complete:           _include_COMPLETE_handler
            });
        };

        this.execute         =   function execute($params){
            Out.debug(_me, "Executing: " + $params.url);

            $.ajax({
                contentType:        'text/javascript',
                dataType:           'script',
                url:                $params.url,
                complete:           function execute_complete($data){

                    if(!$data){
                        Out.error(_self, "Check that you are on a correct domain and do not need proxy.");
                        return;
                    };

                    var pattern =   /this\.name[^=]+[^'"]+.([^'"]+)['"]./;
                    var name    =   $data.responseText.match(pattern);
                        name    =   name[1];

                    Out.debug(_self, "Name should be: " + name);

                    if(window[name] && window[name].construct)
                        window[name].construct($params);
                }
            });
        };


    // ===========================================
    // ===== WORKERS
    // ===========================================

        function _proxify($url){
            var url =   $url;

            if(url.indexOf('http://') > -1 ){
                url =   BASEURL + "proxy.php?file=" + url;

            }else{
                url =   BASEURL + url;
            };

            return url;
        };

        function _isDuplicateInclude($file){
            if(
                _include.indexOf($file) > -1
                || _included.hasOwnProperty($file)
                || _included.indexOf($file) > -1
            ){
                return true;
            };
            return false;
        };

        function _includeComplete(){
            var i;

            _isComplete =   true;

            Out.debug(_self, "Downloads complete... Waiting for document load.");

            $(document).ready(function(){
                // initial construct, we used two basically
                // because of the DOM
                for( i in _classes ){
                    if(Array.prototype[i] != _classes[i]){
                        if(!_classes[i].hasOwnProperty('construct') && !_classes[i].construct){
                            Out.error(_self, _classes[i].name + " doesn't have construct method");
                        }else{
                            _classes[i].construct();
                        }
                    }
                };

                // secondly we're going to extend our classes that asked for it
                for( i in _extensions ){
                    if(Array.prototype[i] != _classes[i]){
                        for(ii in _classes){
                            if(_classes[ii].name == i){
                                _classes[ii]    =   Class.extend(_classes[ii], _findClassByName(_extensions[i]) );
                            };
                        };
                    }
                };

                // we fire init first so that elements that need
                // to be constructed can be formed first.
                for( i in _classes ){
                    if(Array.prototype[i] != _classes[i]){
                        if(!_classes[i].hasOwnProperty('init') && !_classes[i].init){
                            Out.error(_self, _classes[i].name + " doesn't have init method");
                        }else{
                            _classes[i].init();
                        }
                    };
                };

                // fire complete function if it exists
                if(_self.complete)
                    _self.complete();
            });
        };

        function _findClassByName($name){
            for(var i in _classes){
                if(_classes[i] == $name){
                    return _classes[i];
                };
            };

            return window[$name];
        };


    // ===========================================
    // ===== HANDLERS
    // ===========================================

        function _include_COMPLETE_handler($data){
            var lastRequested           =   _include[_included.length];
            _included[lastRequested]    =   1;
            _included.push(lastRequested);

            setTimeout(function(){
                if( _included.length == _include.length && !_isComplete ){
                    _includeComplete();
                };
            }, 500);
        };


        return this;
    };
};