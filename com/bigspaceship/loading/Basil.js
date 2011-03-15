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

if(!window['Basil']){

    /**
    * Basil
    *
    * This is the global loader for all javascript files.
    *
    * @version  1.0
    * @author   Matt Kenefick <m.kenefick@bigspaceship.com>
    * @package  Big Spaceship / Loading
    */
    function Basil($name, $baseUrl){

        // private vars
        var _self           =   this;
        var _hasOut         =   window['Out'] ? true : false;
        var _include        =   [];
        var _included       =   [];
        var _classes        =   [];
        var _extensions     =   {};
        var _isComplete     =   false;

        // public vars
        this.name           =   $name       || 'Basil';
        this.baseUrl        =   $baseUrl    || '';


    // ===========================================
    // ===== CALLABLE
    // ===========================================

        /**
         * forceComplete
         *
         * Allows user to force the complete event to be fired
         * instead of waiting for Basil to figure out whether
         * or not everything has downloaded.
         *
         * Should only be used if all files are compiled into
         * one.
         *
         * @access  public
         * @returns null
         */
        this.forceComplete  =   function forceComplete(){
            _includeComplete();

            return null;
        };

        /**
         * flush
         *
         * Clears out all saved data and arrays related to loading.
         * This allows for a fresh start.
         *
         * @access  public
         * @returns null
         */
        this.flush          =   function flush(){
            if(_hasOut) Out.debug(_self, "Flushing " + _self.name + " includes.");

            _include        =   [];
            _included       =   [];
            _classes        =   [];
        };

        this.register       =   function register($class){
            _classes.push($class);
        };


    // ===========================================
    // ===== Class Creation
    // ===========================================

        this.extend         =   function extend($classA, $classB, $isStatic){
            var _n          =   $classA.name;
            var _t, _c, _c1, _c2;

            if(typeof(window[$classB]) == 'function'){
                // insantiable extension
                _t  =   new window[$classB]();

                // create supers for all elements inside of the class.
                for(var i in _t){
                    _c2 =   _t[i];
                    // class actually exists.. do work in here
                    if(typeof(_c2)=='function'){

                        if($classA[i]){
                            // this only fires when ClassB (under) has the same
                            // function as ClassA (above).. then we super
                            (function(){
                                var __1 =   $.extend($classA[i], []);
                                var __2 =   $.extend(_t[i], []);

                                $classA[i]         =   function _extended_function(){
                                    return (function _superClass(){
                                        this.super  =   __2;
                                        return __1();
                                    })();
                                };
                            })();
                        }
                    };
                };

            }else if($isStatic){
                if(_hasOut) Out.debug(_self, "Extending " + $classA.name + " with " + $classB );
                _extensions[$classA.name]   =   $classB;
                return $classA;

            }else if(typeof(window[$classB]) == 'object'){
                // static class extension
                if(window[$classB]==undefined){
                    if(_hasOut) Out.error(_self, "Static class [" + $classB + "] doesn't exist yet. Cannot be extended.");
                }else{
                    var _t  =   $.extend(_t, window[$classB]);
                    if(_hasOut) Out.debug(_self, "Extending static class");
                }
            }else{
                // error
                if(_hasOut) Out.error(_self, "Class [" + $classB + "] doesn't exist. via@" + $classA['name']);
            };

            _t              =   $.extend(true, _t, $classA);
            _t.name         =   _n;
            if(_t['setSelf'])
                _t.setSelf(_t);

            return _t;
        };

        this.create         =   function create($class){
            _lastClass  =   $class;
            return $class;

            // not required ?
            for(var i in $class){
                $class.__proto__.constructor.prototype[i]   =   $class[i];
                delete $class[i];
            }
            return $class;
        };


    // ===========================================
    // ===== Inclusion
    // ===========================================

        this.include        =   function include($file){
            if(_isDuplicateInclude(_self.baseUrl + $file)){
                if(_hasOut) Out.warning(_self, "Already included: " + $file);
                return;
            };

            // save
            _include.push(_self.baseUrl + $file);
            if(_hasOut) Out.debug(_self, "Including: " + $file);

            $.ajax({
                contentType:        'text/javascript',
                dataType:           'script',
                url:                _self.baseUrl + $file,
                complete:           _include_COMPLETE_handler
            });
        };

        this.execute         =   function execute($params){
            if(_hasOut) Out.debug(_self, "Executing: " + $params.url);

            var baseUrl =   $params.url.split('/');
                baseUrl.pop();
                baseUrl =   baseUrl.join('/') + '/';

            $.ajax({
                contentType:        'text/javascript',
                dataType:           'script',
                url:                $params.url,
                complete:           function execute_complete($data){

                    if(!$data){
                        if(_hasOut) Out.error(_self, "Check that you are on a correct domain and do not need proxy.");
                        return;
                    };

                    var pattern =   /this\.name[^=]+[^'"]+.([^'"]+)['"]./;
                    var name    =   $data.responseText.match(pattern);
                        name    =   name[1];

                    if(_hasOut) Out.debug(_self, "Name should be: " + name);

                    // add basil and public methods
                    if(window[name]){
                        window[name].basil      =   new Basil(window[name].name);
                        window[name].basil.baseUrl      =   baseUrl;
                        window[name].assets     =   baseUrl + 'assets/';
                        window[name].getAsset   =   function getAsset($url){
                            return window[name].assets + $url;
                        };
                    };

                    // construct it
                    if(window[name] && window[name].construct){
                        window[name].construct($params);
                    }

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

            if(_hasOut) Out.debug(_self, "Downloads complete... Waiting for document load.");

            if(window['___DOCUMENT_LOADED']){
                _extendAndInitiate();
            }else{
                $(document).ready(_extendAndInitiate);
            };
        };

        function _extendAndInitiate(){
            ___DOCUMENT_LOADED  =   true;

            // initial construct, we used two basically
            // because of the DOM
            for( i in _classes ){
                if(Array.prototype[i] != _classes[i] && typeof(_classes[i]) != 'function'){
                    if(!_classes[i].hasOwnProperty('construct') && !_classes[i].construct){
                        if(_hasOut) Out.error(_self, _classes[i].name + " doesn't have construct method");
                    }else{
                        _classes[i].construct();
                    }
                }
            };

            // secondly we're going to extend our classes that asked for it
            for( i in _extensions ){
                for(ii in _classes){
                    if(_classes[ii].name == i){
                        window[_classes[ii].name]   =   _self.extend(_classes[ii], _extensions[i]);
                    };
                };
            };

            // we fire init first so that elements that need
            // to be constructed can be formed first.
            for( i in _classes ){
                if(Array.prototype[i] != _classes[i] && typeof(_classes[i]) != 'function'){
                    if(!_classes[i].hasOwnProperty('init') && !_classes[i].init){
                        if(_hasOut) Out.error(_self, _classes[i].name + " doesn't have init method");
                    }else{
                        _classes[i].init();
                    }
                };
            };

            // fire complete function if it exists
            if(_self.complete)
                _self.complete();

            if(_hasOut) Out.debug(_self, "Classes construct/extend/init completed.");
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
