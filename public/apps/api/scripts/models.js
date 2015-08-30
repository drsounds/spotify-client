/* Rerun without minification for verbose metadata */
require(['$api/cosmos'], function (Cosmos) {
     (function (undefined) {
        Element.prototype.closest = function (t) {
            for (var e = this; e;) {
                if (e.matches(t))return e;
                e = e.parentElement
            }
            return null
        };
        Object.assign = function (r, t) {
            for (var n, e, a = 1; a < arguments.length; ++a) {
                e = arguments[a];
                for (n in e)Object.prototype.hasOwnProperty.call(e, n) && (r[n] = e[n])
            }
            return r
        };
        String.prototype.includes = function (t, e) {
            if ("object" == typeof t && t instanceof RegExp)throw new TypeError("First argument to String.prototype.includes must not be a regular expression");
            return -1 !== this.indexOf(t, e)
        };
    }).call('object' === typeof window && window || 'object' === typeof self && self || 'object' === typeof global && global || {});

    var Observable = function () {
        this.events = [];
    }  

    Observable.prototype.addEventListener = function (event, callback) {
        this.events.push({
            event: event,
            callback: callback
        });
    };

    Observable.prototype.dispatchEvent = function (event) {
        for (var i = 0; i < this.events.length; i++) {
            if (this.events[i].type == event.type) {
                this.events[i].callback.call(this, event);
            }
        }
    }

   

    /**
     * @module
     */

    String.prototype.capitalize = function () {
        return this.replace(/^./, function (match) {
            return match.toUpperCase();
        });
    };


    var Loadable = function (data) {
        Object.assign(this, data);
    };

    Loadable.prototype.load = function () {   
        var model = this.type;
        var self = this;
        return new Promise(function (resolve, fail) {
            Cosmos.request('GET', '/music/' + model + 's/' + self.id).then(function (result) {

                resolve(new exports[model.capitalize()](result));
            });            
        });
    }

    exports.Loadable = Loadable;

    var MdL = function (data) {
        Loadable.call(this, data);
    }

    MdL.prototype = Object.create(Loadable.prototype);
    MdL.prototype.constructor = Loadable;

    exports.MdL = MdL;

    var Collection = function (endpoint, uri, type) {
        this.endpoint = endpoint;
        this.uri = uri;
        this.objects = [];
        this.limit = 20;
        this.offset = 0;
        this.type = type;
        this.complete = false;
    };

    Collection.prototype.next = function () {
        var self = this;
        return new Promise(function (resolve, fail) {
            if (self.complete) {
                return;
            }
            var url = self.endpoint + '&offset=' + self.offset + '&limit=' + self.limit + '&type=' + self.type;


            Cosmos.request('GET', url).then(function (result) {
                console.log("GOT REPLY FROM " + url);
                // console.log(result);
                console.log(result);
                for (var i = 0; i < result.objects.length; i++) {
                    self.objects = result.objects;
                }
                self.objects = self.objects.map(function (object) {
                    if ('track' in object) {
                        return Object.assign(object, object.track);
                    }

                    return object;
                });
                if (self.objects.length < 1) {
                    self.complete = true;
                }
                resolve(self);
                self.offset = self.offset + self.limit;
            });
        });
    };

    var collection_stack = {};

    window.sp = {
        require: function (url) {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function (event) {

            }
        }
    }


    


    /**
     * Represents an album
     */
    var Album = function (data) {
        MdL.call(this, data);
        console.log(data);
        this.type = 'album';

        this.tracks = new Collection('/music/albums/' + this.id + '/tracks?', 'bungalow:album:' + this.id, 'track');
    }

    Album.prototype = Object.create(MdL.prototype);

    Album.constructor = Loadable;

    Album.fromId = function (id) {
        return new Album({'id': id, type: 'album'});
    }

    Album.prototype.load = function () {
        var self = this;
        console.log(self.id);
        return new Promise(function (resolve, fail) {
            Cosmos.request('GET', '/music/albums/' + self.id).then(function (result) {
                console.log(result);
                resolve(new Album(result));
            });
        });
    }

    exports.Album = Album;

    /**
     * Represents an artist
     */

    var Artist = function (data) {
        MdL.call(this, data);

        this.albums = new Collection('/music/artists/' + this.id + '/albums?', 'bungalow:artist:' + this.id + ':albums', 'album');
        this.tracks = new Collection('/music/artists/' + this.id + '/tracks?', 'bungalow:artist:' + this.id + ':tracks', 'track');
    }

    Artist.prototype = Object.create(Loadable.prototype);
    Artist.prototype.constructor = Loadable;

   

    Artist.fromId = function (id) {
        return new Artist({'id': id, type: 'artist'});
    };

    exports.Artist = Artist;


/**
     * Represents a playlist
     * @class
     */
    var Playlist = function (data) {
        Loadable.prototype.constructor.call(this, data);
        console.log("DATA", data);
        Object.assign(this, data);
        console.log("OWNER", this.owner);
        this.tracks = new Collection('/music/users/' + this.owner.id + '/playlists/' + this.id + '/tracks?', 'bungalow:user:' + this.owner.id + ':playlist:' + this.id, 'track');
        console.log(this.tracks);
        this.type = 'playlist';
    }

    Playlist.prototype = Object.create(Playlist.prototype);
    Playlist.prototype.constructor = Loadable;

    

    /**
     * Creates a playlist from URI
     * @param  {String}   uri      [description]
     * @return {Promise}            [description]
     */
    Playlist.fromUserId = function (username, id) {
        console.log(username);
        return new Playlist({owner: {id: username}, id: id, type: 'playlist'});
    };

    Playlist.prototype.load = function () {
        var self = this;
        return new Promise(function (resolve, fail) {
            Cosmos.request('GET', '/music/users/' + self.owner.id + '/playlists/' + self.id).then(function (result) {
                resolve(new Playlist(result));
            });
        });
    }

    exports.Playlist = Playlist;


    var User = function (data) {
        
        Loadable.call(this, data);
        this.type = 'user';
        this.playlists = new Collection('/music/users/' + this.id + '/playlists?', 'bungalow:user:' + this.id + ':playlists', 'playlist');
        this.followers = new Collection('/music/users/' + this.id + '/followers?', 'bungalow:user:' + this.id + ':followers', 'user');
    }

    User.prototype = Object.create(Loadable.prototype);
    User.prototype.constructor = Loadable;

    User.fromId = function (id) {
        return new User({'id': id, type: 'user'});
    }

    User.prototype.load = function () {
        var self = this;
        console.log(self.id);
        return new Promise(function (resolve, fail) {
            Cosmos.request('GET', '/music/users/' + self.id).then(function (result) {
                console.log(result);
                resolve(new User(result));
            });
        });
    }


    exports.User = User;

    var albumTracks = {};


    Search = function (data) {
        Object.assign(this, data);
        this.uri = 'bungalow:search:' + this.query;
        this.tracks = new Collection('/music/search?q=' + this.q , this.uri + ':tracks', 'track');
        this.artists = new Collection('/music/search?q=' + this.q , this.uri + ':artists', 'artist');
        this.albums = new Collection('/music/search?q=' + this.q, this.uri + ':albums', 'album');
        this.users = new Collection('/music/search?q=' + this.q, this.uri + ':users', 'user');
        this.playlists = new Collection('/music/search?q=' + this.q, this.uri + ':playlists', 'playlist');
    };

    Search.lists = {};


    Search.search = function (query) {
        return new Search({
            q: query
        });
    };


    exports.Search = Search;

    var Chart = function (data) {
        Loadable.call(this, data);

        this.tracks = new Collection('/music/charts/' + this.id + '/tracks?', 'bungalow:chart:' + this.id + ':tracks', 'track');
        this.albums = new Collection('/music/charts/' + this.id + '/albums?', 'bungalow:chart:' + this.id + ':albums', 'album');
    }

    Chart.prototype = new Loadable;
    Chart.prototype.constructor = new Loadable();

    exports.Chart = Chart;


    Chart.fromId = function (id) {
        return new Chart({'id': id, 'type': 'chart'});
    }

    var Year = function (data) {
        Loadable.call(this, data);
        this.albums = new Collection('/music/years/' + this.year + '/albums?', 'bungalow:year:' + this.year + ':tracks');
        this.tracks = new Collection('/music/years/' + this.year + '/tracks?', 'bungalow:year:' + this.year + ':tracks');
    }

    Year.prototype = Object.create(Loadable.prototype);
    Year.prototype.constructor = Loadable;

    Year.fromYear = function (year) {
        return new Promise(function (resolve, fail) {
            Cosmos.request('GET', '/music/years/' + year).then(function (result) {
                resolve(new Year(year));
            });
        });
    }

    var Track = function (data) {
        Object.assign(this, data);
    }

    Track.fromId = function (id) {
          resolve(new Track(id));
          
    };

    exports.Track = Track;

    var Country = function (data) {
        Object.assign(this, data);

    }

    Country.fromCode = function (countryCode) {
        return new Country({'id': countryCode, type: 'country'});
    
    }
    Country.prototype = new Loadable;
    Country.prototype.constructor = new Loadable();

    exports.Country = Country;


    var App = function (data) {
        this.data = data;
    };


    App.find = function (callback) {
        // console.log("Listing app");
        $.getJSON('http://appfinder.aleros.webfactional.com/api/index.php', function (apps) {
            callback(apps);
        });
    }

    App.fromId = function (appId) {

    }

    App.prototype.install = function () {
        var settings = bungalow_get_settings();
        settings.apps.push(this.data);
    }

    var Application = function () {
        this.events = [];
    }

    Application.prototype = Object.create(Observable.prototype);
    Application.prototype.constructor = Observable;

    exports.application = new Application();
    console.log("T");
    window.addEventListener('message', function (event) {
        var data = event.data;
        console.log(event);
        if (data.action == 'navigate') {
            var evt = new CustomEvent('argumentschanged');
            evt.data = data.arguments;
            console.log("A");
            exports.application.dispatchEvent(evt);
        }
    })

});