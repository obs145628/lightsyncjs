/*!
 * lightsyncjs v0.2.0
 * Author: Steven Lariau <obs145628@gmail.com>
 * Date: 2015-09-20
 */

(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.lightSync = factory();
    }
}(this, function() {


    /**
     * Shortcut for get/set localStorage items
     * @param {string} key
     * @param {*} [value] If precised the function makes a set, otherwise a get
     * @returns {*|null} Return nothing for a get, or the item value for a set
     */
    var ls = function(key, value) {
        if (typeof value === "undefined")
            return ls.get(key);
        else
            return ls.set(key, value);
    };

    /**
     * Get localstorage item, using JSON.parse
     * @param {string} key
     * @returns {*}
     */
    ls.get = function(key) {
        return JSON.parse(localStorage.getItem(key));
    };

    /**
     * Set localstorage item, using JSON.stringify
     * @param{string} key
     * @param {*} value
     */
    ls.set = function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    };

    /**
     * Indicates if an item is present in the local storage
     * @param {string} key
     * @returns {bool}
     */
    ls.has = function(key) {
        return localStorage.getItem(key) !== null;
    };

    /**
     * Set the value of an item if it isn't on the local storage, and retuns it
     * @param {string} key
     * @param {*} value
     * @returns {*}
     */
    ls.init = function(key, value) {
        if (ls.has(key))
            return ls.get(key);
        else {
            ls.set(value);
            return value;
        }
    };

    /**
     * Remove an item from the local storage
     * @param {string} key
     * @returns {object}
     */
    ls.remove = function(key) {
        localStorage.removeItem(key);
    };

    /** Remove all items from the local storage */
    ls.clear = function() {
        localStorage.clear();
    };

    var handleXHREvents = function(xhr, callback) {
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var data = xhr.responseText;
                    var parsedData = null;
                    try {
                        parsedData = JSON.parse(data);
                    } catch (e) {
                        parsedData = data;
                    }
                    callback(null, parsedData);
                } else {
                    callback({
                        status: xhr.status,
                        responseText: xhr.responseText
                    });
                }
            }
        };
    };

    var http = {

        /**
         * Send an AJAX get request
         * @param {string} url the request's url
         * @param {xhrCallback} callback called when the response is ready
         */
        get: function(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            handleXHREvents(xhr, callback);
            xhr.send();
        },

        /**
         * Send an AJAX post json request
         * @param {string} url the request's url
         * @param {object} params request body send in JSON
         * @param {xhrCallback} callback called when the response is ready
         */
        post: function(url, params, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-type", "application/json");
            handleXHREvents(xhr, callback);
            xhr.send(JSON.stringify(params));
        }

    };

    /**
     * Callback for handling xhr response
     * @callback xhrCallback
     * @param {object} err A response error if something went wrong, otherwise null
     * @param {number} err.status
     * @param {string} err.responseText
     * @param {object} data The response body, it's an object if the response is in JSON, otherwise a string
     */

    /**
     * Add event's functons on, off and trigger to an object
     * @param {object} o
     **/
    var useEvents = function(o) {
        /**
         * Add an event listener
         * @param {string} name event's name
         * @param {function} callback event's listener
         **/
        o.on = function(name, callback) {
            if (typeof this._listeners === "undefined")
                this._listeners = {};
            if (typeof this._listeners[name] === "undefined")
                this._listeners[name] = [];
            this._listeners[name].push(callback);
        };

        /**
         * Remove event's listener
         * @param {string} name event's name
         * @param {function} [callback] If precised, only remove this listener, otherwise remove all listeners of the event
         **/
        o.off = function(name, callback) {
                if (typeof this._listeners[name] === "undefined")
                    return;

                if (typeof callback === "undefined")
                    this._listeners[name] = [];
                else {
                    var i = this._listeners[name].indexOf(callback);
                    if (i !== -1)
                        this._listeners[name].splice(i, 1);
                }
            },

            /**
             * Trigger an event with the specified parameters
             * @param {string} name even'ts name
             * @param {...*} [args] Arguments send to the listeners
             */
            o.trigger = function(name) {
                if (!this._listeners || !this._listeners[name])
                    return;
                var listeners = this._listeners[name];
                var args = Array.prototype.slice.call(arguments, 1);
                for (var i = 0; i < listeners.length; ++i)
                    listeners[i].apply(this, args);
            };
    };

    /**
     * Realise a shallow copy of a litteral object
     * @param {object} o
     * @returns {object}
     */
    var cloneObject = function(obj) {
        var clone = {};
        for (var key in obj)
            if (obj.hasOwnProperty(key))
                clone[key] = obj[key];
        return clone;
    };



    var dropboxClient = null;

    var dropboxError = function(err) {
        if (!err)
            return null;
        return {
            status: err.status,
            responseText: err.responseText
        };
    };

    var dropboxWrapper = {

        init: function(options) {
            dropboxClient = new Dropbox.Client(options);
            dropboxClient.authDriver(new Dropbox.AuthDriver.Popup({
                receiverUrl: options.receiverUrl
            }));
        },

        getUserInfos: function(callback) {
            dropboxClient.getAccountInfo(function(err, data) {
                if (err)
                    callback(dropboxError(err));
                else
                    callback(null, {
                        name: data.name
                    });
            });
        },

        readFile: function(path, callback) {
            dropboxClient.readFile(path, function(err, data) {
                callback(dropboxError(err), data);
            });
        },

        writeFile: function(path, content, callback) {
            dropboxClient.writeFile(path, content, function(err) {
                callback(dropboxError(err));
            });
        },

        connect: function(callback) {
            dropboxClient.authenticate(function(err) {
                if (err)
                    callback(dropboxError(err));
                else
                    dropboxWrapper.getUserInfos(callback);
            });
        }

    };

    var gClientId = null;
    var gFiles = {};
    var gEvents = [];

    var triggerGLoad = function(err) {
        for (var i = 0; i < gEvents.length; ++i)
            gEvents[i](err);
    };

    var gapiTest = setInterval(function() {
        if (gapi.auth) {
            clearInterval(gapiTest);
            triggerGLoad(null);
        }
    }, 100);

    var onGapiLoad = function(callback) {
        if (gapi.auth)
            callback(null);
        else
            gEvents.push(callback);
    };

    var gConnect = function(callback) {
        onGapiLoad(function(err) {
            if (err) {
                callback(err);
                return;
            }

            gapi.auth.authorize({
                client_id: gClientId,
                scope: ["https://www.googleapis.com/auth/drive"],
                immediate: true
            }, function(authResult) {
                if (!authResult.error) {
                    callback(null);
                    return;
                }

                gapi.auth.authorize({
                    client_id: gClientId,
                    scope: ["https://www.googleapis.com/auth/drive"],
                    immediate: false
                }, function(authResult) {
                    if (authResult.error)
                        callback(authResult.error);
                    else
                        callback(null);
                });
            });
        });
    };

    var googleDrive = {

        init: function(options) {
            gClientId = options.client_id;
        },

        connect: function(callback) {
            gConnect(function(err) {
                if (err) {
                    callback(err);
                    return;
                }

                gapi.client.load("drive", "v2", function() {
                    gapi.client.drive.files.list({}).execute(function(data) {
                        if (!data) {
                            callback("unable to get files list");
                            return;
                        }

                        var items = data.items;
                        for (var i = 0; i < items.length; ++i)
                            gFiles[items[i].title] = items[i].id;

                        gapi.client.drive.about.get().execute(function(data) {
                            if (data)
                                callback(null, {
                                    name: data.name
                                });
                            else
                                callback("unable to get user infos");
                        });
                    });
                });
            });
        },

        readFile: function(path, callback) {
            if (!gFiles[path]) {
                callback({
                    status: 404,
                    responseText: "File Not Found"
                });
                return;
            }

            gapi.client.drive.files.get({
                "fileId": gFiles[path]
            }).execute(function(data) {
                if (!data) {
                    callback({
                        status: 500,
                        responseText: "Internal Server Error"
                    });
                    return;
                }

                var url = data.downloadUrl;
                var accessToken = gapi.auth.getToken().access_token;
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                xhr.onload = function() {
                    callback(null, xhr.responseText);
                };
                xhr.onerror = function() {
                    callback({
                        status: xhr.status,
                        responseText: xhr.responseText
                    });
                };
                xhr.send();
            });
        },

        writeFile: function(path, content, callback) {
            var boundary = "-------314159265358979323846";
            var delimiter = "\r\n--" + boundary + "\r\n";
            var close_delim = "\r\n--" + boundary + "--";
            var contentType = "text/plain";
            var metadata = {
                "title": path,
                "mimeType": contentType
            };

            var multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n' +
                '\r\n' +
                content +
                close_delim;

            var id = gFiles[path];
            var reqPath = "/upload/drive/v2/files";
            if (id)
                reqPath += "/" + id;

            var request = gapi.client.request({
                path: reqPath,
                method: id ? "PUT" : "POST",
                params: {
                    uploadType: "multipart"
                },
                headers: {
                    "Content-Type": 'multipart/mixed; boundary="' + boundary + '"'
                },
                body: multipartRequestBody
            });

            request.execute(function(data) {
                if (!data)
                    callback("unable to write file");
                else {
                    if (!id)
                        gFiles[path] = data.id;
                    callback(null);
                }
            });
        }

    };

    var getStoredKey = function() {
        return ls.get("datadb_key");
    };

    var setStoredKey = function(key) {
        ls.set("datadb_key", key);
    };

    var clearStoredKey = function() {
        ls.remove("datadb_key");
    };

    var serverRequest = function(command, callback, options) {
        if (typeof options === "undefined")
            options = {};
        options.command = command;
        options.key = getStoredKey();
        http.post("/obsdbserver", options, function(err, data) {
            if (err)
                callback(err);
            else if (data.err)
                callback(data.err);
            else if (data.content)
                callback(null, data.content);
            else
                callback(null);
        });
    };



    var lightServer = {

        init: function() {},

        signin: function(user, pass, callback) {
            serverRequest("signin", callback, {
                user: user,
                pass: pass
            });
        },

        signup: function(user, pass, callback) {
            serverRequest("signup", callback, {
                user: user,
                pass: pass
            });
        },

        userAvailable: function(user, callback) {
            serverRequest("userav", callback, {
                user: user
            });
        },

        testKey: function(key, callback) {
            serverRequest("testkey", callback);
        },

        getUserInfos: function(callback) {
            serverRequest("userinfos", callback);
        },

        readFile: function(path, callback) {
            serverRequest("readfile", callback, {
                path: path
            });
        },

        writeFile: function(path, content, callback) {
            serverRequest("writefile", callback, {
                path: path,
                content: content
            });
        },

        connect: function(callback) {
            var key = getStoredKey();
            if (key) {
                lightServer.testKey(key, function(err, ok) {
                    if (err)
                        callback(err);
                    else if (!ok) {
                        callback("invalid key");
                        clearStoredKey();
                    } else
                        lightServer.getUserInfos(callback);
                });
            } else {
                var connectCallback = function(err, key) {
                    if (err)
                        callback(err);
                    else {
                        setStoredKey(key);
                        lightServer.getUserInfos(callback);
                    }
                };

                var user = prompt("LightServer Username (empty if no account)");

                if (user === "") {
                    user = prompt("New LightServer Username");
                    var pass1 = prompt("LightServer Password");
                    var pass2 = prompt("Repeat Your password");
                    if (pass1 !== pass2)
                        callback("passwords don't match");
                    else
                        lightServer.signup(user, pass1, connectCallback);
                } else {
                    var pass = prompt("LightServer PassWord");
                    lightServer.signin(user, pass, connectCallback);
                }
            }
        }
    };

    var frServers = {};
    var connectedServer = ls.init("_fr_co_server", null);
    var connectedToServer = false;
    var userInfos = ls.init("_fr_user_infos", null);

    var connecting = false;
    var onConnect = [];
    var connectToServer = function(callback, firstCo) {
        if (connecting) {
            onConnect.push(callback);
            return;
        }

        if (!connectedServer && !firstCo) {
            callback("no server defined");
            return;
        }
        if (connectedToServer) {
            callback(null);
            return;
        }

        connecting = true;

        if (!firstCo)
            firstCo = connectedServer;

        frServers[firstCo].connect(function(err, data) {
            connecting = false;
            if (err)
                callback(err);
            else {
                connectedToServer = true;
                userInfos = data;
                ls.set("_fr_user_infos", data);
                callback(null);
            }
            for (var i = 0; i < onConnect.length; ++i)
                onConnect[i](err);
        });
    };


    var filesRemote = {


        /**
         * Extends fileRemote by adding a new server helper
         * @param {string} name server's name
         * @param {object} server object with server's function
         */
        addServer: function(name, server) {
            frServers[name] = server;
        },

        /**
         * Initialize servers helpers
         * @param {object} options Each key is a name of a server, and the value is send to the server's init function
         */
        init: function(options) {
            for (var lib in options) {
                frServers[lib].init(options[lib]);
            }
            connectToServer(function() {});
        },

        /**
         * Try establishing connection with a server
         * @param {string} serverName
         * @param {filesRemote~connectCb} callback
         */
        connect: function(serverName, callback) {
            if (connectedServer) {
                callback("already conected");
                return;
            }

            connectToServer(function(err) {
                if (err)
                    callback(err);
                else {
                    connectedServer = serverName;
                    ls.set("_fr_co_server", connectedServer);
                    callback(null);
                }
            }, serverName);
        },

        /** Sign out from the connected sever */
        signout: function() {
            ls.set("_fr_co_server", null);
            connectedServer = null;
            connectedToServer = false;
            ls.set("fr_user_infos", null);
            userInfos = null;
            onConnect = [];
        },

        /**
         * Indicates if the user has parametred a server
         * returns {bool}
         */
        isConfigured: function() {
            return !!connectedServer;
        },

        /**
         * Indicates if a connection is established with a server
         * @returns {bool}
         */
        isConnected: function() {
            return connectedToServer;
        },

        /**
         * Returns user informations from the server, or null if the server isn't configured
         * @returns {object|null}
         */
        getUserInfos: function() {
            return userInfos;
        },

        /**
         * Returns server name, or null if the server isn't configured
         * @returns {string|null}
         */
        getServerName: function() {
            return connectedServer;
        },

        /**
         * Get a file content from the server
         * @param {string} path
         * @param {filesRemote~readFileCb} callback
         */
        readFile: function(path, callback) {
            connectToServer(function(err) {
                if (err)
                    callback(err);
                else
                    frServers[connectedServer].readFile(path, callback);
            });
        },

        /**
         * Write a file to the server
         * @param {string} path
         * @param {string} content
         * @param {filesRemote~writeFileCb} callback
         */
        writeFile: function(path, content, callback) {
            connectToServer(function(err) {
                if (err)
                    callback(err);
                else
                    frServers[connectedServer].writeFile(path, content, callback);
            });
        }

        /**
         * Callback called when the connection response is ready
         * @callback filesRemote~connectCb
         * @param {*|null} err An error object if something went wrong, null otherwise
         */

        /**
         * Callback called when the read file response is ready
         * @callback filesRemote~readFileCb
         * @param {object|null} err An error object if something went wrong, null otherwise
         * @param {number} err.status
         * @param {string} err.responseText
         * @param {string|null} content File content
         */

        /**
         * Callback called when the write file response is ready
         * @callback filesRemote~writeFileCb
         * @param {*|null} err An error object if something went wrong, null otherwise
         */



    };

    filesRemote.addServer("googledrive", googleDrive);
    filesRemote.addServer("dropbox", dropboxWrapper);
    filesRemote.addServer("lightserver", lightServer);

    var collections = {};

    var createObject = function(Parent) {
        if (typeof Object.create !== "undefined")
            return Object.create(Parent);

        var F = function() {};
        F.prototype = Parent;
        return new F();
    };

    var getId = function() {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    };

    /**
     * LightSync data collection
     * @class
     */
    var Collection = {

        /**
         * Initializes the collection object
         * @param {string} key The prefix of the keys in the local storage
         */
        init: function(key) {
            this._key = key + "_";
            this._items = [];

            var keys = lisy.getKeys();
            for (var i = 0; i < keys.length; ++i) {
                if (keys[i].indexOf(this._key) === 0) {
                    var id = keys[i].substr(this._key.length);
                    var item = lisy.getItem(keys[i]);
                    item.id = id;
                    item.date = new Date(lisy.getModifiedTime(keys[i]));
                    this._items.push(item);
                }
            }

            var self = this;

            lisy.on("serversetAny", function(key) {
                if (key.indexOf(self._key) !== 0)
                    return;

                var id = key.substr(self._key.length);
                var item = lisy.getItem(key);
                item.date = new Date(lisy.getModifiedTime(key));
                var i = 0;
                for (; i < self._items.length && self._items[i].id !== id; ++i);

                if (i === self._items.length) {
                    item.id = id;
                    self._items.push(item);
                    self.trigger("add", item);
                } else {
                    var oldItem = cloneObject(self._items[i]);
                    for (var attr in item)
                        self._items[i][attr] = item[attr];
                    self.trigger("update_" + item.id, oldItem, item);
                    self.trigger("updateAny", oldItem, item);
                }

                self.trigger("change");
            });

            lisy.on("serverremoveAny", function(key) {
                if (key.indexOf(self._key) !== 0)
                    return;

                var id = key.substr(self._key.length);
                var i = 0;
                for (; self._items[i].id !== id; ++i);

                var item = self._items[i];
                self._items.splice(i, 1);

                self.trigger("remove_" + item.id, item);
                self.trigger("removeAny", item);
                self.trigger("change");
            });

            lisy.on("clear", function() {
                for (var i = 0; i < self._items.length;) {
                    var item = self._items[0];
                    self._items.splice(0, 1);
                    self.trigger("remove_" + item.id, item);
                    self.trigger("removeAny", item);
                }
                self.trigger("clear");
                self.trigger("change");
            });

        },

        _getDataClone: function(item) {
            var dataItem = {};
            for (var key in item)
                if (item.hasOwnProperty(key) && key !== "date" && key !== "id")
                    dataItem[key] = item[key];
            return dataItem;
        },

        /**
         * Returns collection items
         * @returns {object[]}
         */
        getItems: function() {
            return this._items;
        },

        /**
         * Remove an item from the collection
         * @param {object} item
         */
        removeItem: function(item) {
            var i = this._items.indexOf(item);
            if (i !== -1) {
                this._items.splice(i, 1);
                lisy.removeItem(this._key + item.id);
                this.trigger("remove_" + item.id, item);
                this.trigger("removeAny", item);
                this.trigger("change");
            }
        },

        /**
         * Add an item to the collection
         * @param {object} item
         */
        addItem: function(item) {
            var id = getId();
            var key = this._key + id;
            item.id = id;
            item.date = new Date(lisy.getModifiedTime(key));
            this._items.push(item);
            lisy.setItem(key, this._getDataClone(item));
            this.trigger("add", item);
            this.trigger("change");
        },

        /**
         * Update an item of the collection
         * @param {object} item The updated item
         */
        updateItem: function(item) {
            var i = this._items.indexOf(item);
            if (i === -1)
                return;

            var oldItem = lisy.getItem(this._key + item.id);
            lisy.setItem(this._key + item.id, this._getDataClone(item));
            this.trigger("update_" + item.id, oldItem, item);
            this.trigger("updateAny", oldItem, item);
            this.trigger("change");
        },

        /** remove all items from the collection */
        clear: function() {
            for (var i = 0; i < this._items.length;)
                this.removeItem(this._items[0]);
            this.trigger("clear");
        },

        /** Returns the item with the specified id, or null if the id doesn't exists
         * @param {string} id
         * returns {object|null}
         */
        getById: function(id) {
            for (var i = 0; i < this._items.length; ++i)
                if (this._items[i].id === id)
                    return this._items[i];
            return null;
        },

        onUpdateItem: function(item, callback) {
            this.on("updte_" + item.id, callback);
        },

        onRemoveItem: function(item, callback) {
            this.on("remove_" + item.id, callback);
        }

    };
    useEvents(Collection);

    /**
     * Collection's Factory, creates a Collection object if doesn't exists yet, and returns it
     * @param {string} key
     */
    var getCollection = function(key) {
        key = lisy.getFullKey(key);
        if (typeof collections[key] !== "undefined")
            return collections[key];

        collections[key] = createObject(Collection);
        collections[key].init.apply(collections[key], arguments);
        return collections[key];
    };

    var keysInfos = ls.init("main._keys", {});
    var lastSync = ls.init("_last_sync", -1);

    var syncRunning = false;
    var appPrefix = "lightsync_";

    var lisy = {

        /**
         * Add default prefix to the key if it hasn't any
         * @param {string} key
         * @returns {string}
         */
        getFullKey: function(key) {
            if (key.indexOf(".") === -1)
                return "main." + key;
            else
                return key;
        },

        onSetItem: function(key, callback) {
            lisy.on("set_" + lisy.getFullKey(key), callback);
        },

        onRemoveItem: function(key, callback) {
            lisy.on("remove_" + lisy.getFullKey(key), callback);
        },

        onClientSetItem: function(key, callback) {
            lisy.on("clientset_" + lisy.getFullKey(key), callback);
        },

        onClientRemoveItem: function(key, callback) {
            lisy.on("clientremove_" + lisy.getFullKey(key), callback);
        },

        onServerSetItem: function(key, callback) {
            lisy.on("servertset_" + lisy.getFullKey(key), callback);
        },

        onServerRemoveItem: function(key, callback) {
            lisy.on("serverremove_" + lisy.getFullKey(key), callback);
        },

        /**
         * Returns the timestamp in milliseconds of the date of the last synchronosation, or -1 if no synchronisation occured yet
         * @returns {number}
         */
        getLastSyncTime: function() {
            return lastSync;
        },

        /**
         * Indicates if the synchronisation is running
         * @returns {bool}
         */
        isSyncing: function() {
            return syncRunning;
        },

        /**
         * Inits both lightSync and filesRemote
         * @params {object} options
         * @params {string} [options._name=lightsync] prefix added to saved files
         */
        init: function(options) {
            if (options._name) {
                appPrefix = options._name + "_";
                delete options._name;
            }

            filesRemote.init(options);
        },

        /** Signout from the server and clear all data */
        signout: function() {
            ls.clear();
            keysInfos = [];
            lastSync = -1;
            lisy.trigger("clear");
            filesRemote.signout();
        },

        /**
         * Try synchronising local storage with the server
         * @param {lisy~syncCb} callback
         */
        sync: function(callback) {
            if (syncRunning) {
                callback("already syncing");
                return;
            }

            syncRunning = true;

            filesRemote.readFile(appPrefix + "main", function(err, data) {
                var serverMain = null;
                if (err) {
                    if (err.status === 404) {
                        serverMain = {
                            _keys: {}
                        };
                    } else {
                        syncRunning = false;
                        callback(err);
                        return;
                    }
                } else
                    serverMain = JSON.parse(data);


                var serverKeys = serverMain._keys;

                var serverSet = [];
                var serverRm = [];
                var clientSet = [];
                var clientRm = [];

                for (var key in keysInfos) {
                    var clientKey = keysInfos[key];
                    var serverKey = serverKeys[key];
                    if (clientKey[1] && serverKey && serverKey[1]) {
                        if (clientKey[0] > serverKey[0])
                            serverSet.push(key);
                        else if (clientKey[0] < serverKey[0])
                            clientSet.push(key);
                    } else if (clientKey[1] && (!serverKey || !serverKey[1])) {
                        if (!serverKey || clientKey[0] > serverKey[0])
                            serverSet.push(key);
                        else
                            clientRm.push(key);
                    } else if (!clientKey[1] && serverKey && serverKey[1]) {
                        if (clientKey[0] > serverKey[0])
                            serverRm.push(key);
                        else
                            clientSet.push(key);
                    }
                }


                for (var key in serverKeys)
                    if (!keysInfos[key] && serverKeys[key][1])
                        clientSet.push(key);

                var toFileRep = function(data) {
                    var o = {};
                    for (var i = 0; i < data.length; ++i) {
                        var key = data[i];
                        var dotI = key.indexOf(".");
                        var file = key.substr(0, dotI);
                        if (typeof o[file] === "undefined")
                            o[file] = [];
                        o[file].push(key.substr(dotI + 1));
                    }
                    return o;
                };

                for (var i = 0; i < serverSet.length; ++i)
                    serverKeys[serverSet[i]] = keysInfos[serverSet[i]];
                for (var i = 0; i < serverRm.length; ++i)
                    serverKeys[serverRm[i]] = keysInfos[serverRm[i]];


                var fClientSet = toFileRep(clientSet);
                var fClientRm = toFileRep(clientRm);
                var fServerSet = toFileRep(serverSet);
                var fServerRm = toFileRep(serverRm);

                var readFiles = [];
                for (var file in fClientSet)
                    if (file !== "main" && readFiles.indexOf(file) === -1)
                        readFiles.push(file);
                for (var file in fServerSet)
                    if (file !== "main" && readFiles.indexOf(file) === -1)
                        readFiles.push(file);
                for (var file in fServerRm)
                    if (file !== "main" && readFiles.indexOf(file) === -1)
                        readFiles.push(file);

                var readData = {};
                readData.main = serverMain;

                var readCallback = function() {
                    var writeFiles = [];

                    for (var file in fServerSet) {
                        if (file !== "main" && writeFiles.indexOf(file) === -1)
                            writeFiles.push(file);
                        var keys = fServerSet[file];

                        for (var i = 0; i < keys.length; ++i)
                            readData[file][keys[i]] = ls.get(file + "." + keys[i]);
                    }

                    for (var file in fServerRm) {
                        if (file !== "main" && writeFiles.indexOf(file) === -1)
                            writeFiles.push(file);
                        var keys = fServerRm[file];
                        for (var i = 0; i < keys.length; ++i)
                            delete readData[file][keys[i]];
                    }

                    var writeCallback = function() {
                        for (var file in fClientSet) {
                            var keys = fClientSet[file];
                            for (var i = 0; i < keys.length; ++i) {
                                var key = file + "." + keys[i];
                                ls.set(key, readData[file][keys[i]]);
                                lisy.trigger("serverset_" + key);
                                lisy.trigger("serversetAny", key);
                                lisy.trigger("set_" + key);
                                lisy.trigger("setAny", key);
                            }
                        }

                        for (var file in fClientRm) {
                            var keys = fClientRm[file];
                            for (var i = 0; i < keys.length; ++i) {
                                var key = file + "." + keys[i];
                                ls.remove(key);
                                lisy.trigger("serverremove_" + key);
                                lisy.trigger("serverremoveAny", key);
                                lisy.trigger("remove_" + key);
                                lisy.trigger("removeAny", key);
                            }
                        }

                        keysInfos = serverKeys;
                        ls.set("main._keys", keysInfos);
                        syncRunning = false;
                        var time = new Date().getTime();
                        ls.set("_last_sync", time);
                        lastSync = time;
                        callback();
                    };

                    var writeMain = function() {
                        filesRemote.writeFile(appPrefix + "main", JSON.stringify(readData.main), function(err) {
                            if (err) {
                                syncRunning = false;
                                callback(err);
                            } else
                                writeCallback();
                        });
                    };

                    if (!serverSet.length && !serverRm.length)
                        writeCallback();
                    else if (!writeFiles.length)
                        writeMain();

                    var nbWrote = 0;

                    for (var i = 0; i < writeFiles.length; ++i) {
                        filesRemote.writeFile(appPrefix + writeFiles[i], JSON.stringify(readData[writeFiles[i]]), function(err) {
                            if (err) {
                                syncRunning = false;
                                callback(err);
                            } else if (++nbWrote === writeFiles.length)
                                writeMain();
                        });
                    }

                };

                if (readFiles.length === 0)
                    readCallback();

                var nbRead = 0;
                for (var i = 0; i < readFiles.length; ++i) {
                    (function(i) {
                        filesRemote.readFile(appPrefix + readFiles[i], function(err, data) {
                            if (err) {
                                if (err.status === 404)
                                    readData[readFiles[i]] = {};
                                else {
                                    syncRunning = false;
                                    callback(err);
                                    return;
                                }
                            } else
                                readData[readFiles[i]] = JSON.parse(data);

                            if (++nbRead === readFiles.length)
                                readCallback();
                        });
                    })(i);
                }


            });

        },

        /**
         * Get item from the local storage
         * @param {string} key
         * @return {*}
         */
        getItem: function(key) {
            return ls.get(lisy.getFullKey(key));
        },

        /**
         * Save item to the local storage
         * @param {string} key
         * @param {*} content
         */
        setItem: function(key, value) {
            key = lisy.getFullKey(key);
            ls.set(key, value);
            keysInfos[key] = [new Date().getTime(), true];
            ls.set("main._keys", keysInfos);
            lisy.trigger("clientset_" + key);
            lisy.trigger("clientsetAny", key);
            lisy.trigger("set_" + key);
            lisy.trigger("setAny", key);
        },

        /**
         * Indicates if the local storage contains an item
         * @param {string} key
         * @returns {bool}
         */
        hasItem: function(key) {
            key = lisy.getFullKey(key);
            return keysInfos[key] && keysInfos[key][1];
        },

        /**
         * Set the value of an item if it isn't in the local storage, and returns it
         * @param {string} key
         * @param {*} value
         * @return {µ}
         */
        initItem: function(key, value) {
            if (lisy.hasItem(key))
                return lisy.getItem(key);
            else {
                lisy.setItem(key, value);
                return value;
            }
        },

        /**
         * Removes item from the local storage
         * @param {string} key
         */
        removeItem: function(key) {
            if (!lisy.hasItem(key))
                return;

            key = lisy.getFullKey(key);
            ls.remove(key);
            keysInfos[key] = [new Date().getTime(), false];
            ls.set("main._keys", keysInfos);
            lisy.trigger("clientremove_" + key);
            lisy.trigger("clientremoveAny", key);
            lisy.trigger("remove_" + key);
            lisy.trigger("removeAny", key);
        },

        /**
         * Get the modification timestamp in ms of a local storage item
         * @param {string} key
         * @returns {number}
         */
        getModifiedTime: function(key) {
            key = lisy.getFullKey(key);
            if (!keysInfos[key] || !keysInfos[key][1])
                return null;
            else
                return keysInfos[key][0];
        },

        /**
         * Get the list of all keys in the local storage
         * @returns {string[]}
         */
        getKeys: function() {
            var keys = [];
            for (var key in keysInfos)
                if (keysInfos[key][1])
                    keys.push(key);
            return keys;
        }

    };
    useEvents(lisy);

    lisy.filesRemote = filesRemote;
    lisy.connect = filesRemote.connect;
    lisy.getUserInfos = filesRemote.getUserInfos;
    lisy.isConfigured = filesRemote.isConfigured;
    lisy.isConnected = filesRemote.isConnected;
    lisy.getServerName = filesRemote.getServerName;
    lisy.addServer = filesRemote.addServer;
    lisy.getCollection = getCollection;

    return lisy;
}));
