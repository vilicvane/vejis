/// <reference path="vejis.js" />

module_("drop", function () {
    var drop = this;
    var global = (function () { return this; })();
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    //private mark object for fn to return drop.Value
    //but not value of drop.Value.
    var forFn = {};

    this.DropData = function (data) {
        this.value = data;
    };

    this.createData = function (data, ondatachange) {
        if (is_(data, PlainObject))
            return new drop.Node(data, ondatachange);
        else
            return new drop.Value(data, ondatachange);
    };

    this.Value = function (value, onvaluechange) {
        var handlers = [];

        onvaluechange =
        typeof onvaluechange == "function" ?
        onvaluechange : function () { };

        var fn = function (newValue) {
            if (arguments.length > 0 && value != newValue) {
                value = newValue;
                onchange();
            }
            return value;
        };

        fn.type = "value";
        fn.__vejisType__ = drop.Value;

        fn.bind = _(Function, function (handler) {
            handlers.push(handler);
            handler.call(fn);
        });

        fn.bindAsync = _(Function, function (handler) {
            var processing = false;
            var asyncObject = {
                complete: function () {
                    processing = false;
                },
                cancel: null
            };

            fn.bind(function () {
                if (processing)
                    asyncObject.cancel();
                else
                    processing = true;

                handler.call(fn, asyncObject);

                if (processing && typeof asyncObject.cancel != "function")
                    throw new Error("the cancel handler is required for async object when using bindAsync");
            });
        });

        fn.invokeOnchange = onchange;

        fn.toString = function () { return value.toString(); };
        fn.valueOf = function () { return value; };

        return fn;

        function onchange() {
            for (var i = 0; i < handlers.length; i++)
                handlers[i].call(fn);
            onvaluechange();
        }
    };

    this.Node = function (init, onchildchange) {
        var handlers = [];

        var node = {};

        onchildchange =
        typeof onchildchange == "function" ?
        onchildchange : function () { };

        var fn = function (name, o) {
            if (arguments.length == 0)
                return fn;
            else if (typeof name == "string") {

                var pIndex = name.indexOf(".");
                var subname;
                if (pIndex >= 0) {
                    subname = name.substr(pIndex + 1);
                    name = name.substr(0, pIndex);
                    var args = [subname];
                    if (arguments.length > 1)
                        args.push(o);

                    //if (hasOwnProperty.call(node, i))
                    return fn(name).apply(this, args);
                }

                //get
                if (arguments.length == 1)
                    return hasOwnProperty.call(node, name) ? node[name]() : undefined;
                //set
                else {
                    if (!hasOwnProperty.call(node, name)) {
                        if (o == forFn) {
                            fn(name, undefined);
                            return fn(name, forFn);
                        }
                        else {
                            var data;
                            if (o instanceof drop.DropData) {
                                data = o.value;
                                data.bind(onchange);
                            }
                            else
                                data = drop.createData(o, onchange);

                            node[name] = data;
                            onchange();
                            return data();
                        }
                    }
                    else if (o == forFn)
                        return node[name];
                    else return node[name](o);
                }
            }
            //set
            else if (isPlainObject(name)) {
                o = name;
                for (var i in o)
                    if (hasOwnProperty.call(o, i))
                        fn(i, o[i]);
                return fn;
            }
            else
                throw new Error("invalid arguments");
        };

        fn.type = "node";
        fn.__vejisType__ = drop.Node;

        fn.add = _(String, Object, function (name, data) {
            return fn(name, new drop.DropData(data));
        });

        fn.bind = _(params_(String), Function, function (names, handler) {
            if (names.length) {
                for (var i = 0; i < names.length; i++) {
                    var name = names[i];
                    if (typeof name != "string")
                        throw new Error("names must be an array of strings");
                    var subFn = fn(names[i].replace(/^\s+|\s+$/g, ""), forFn);
                    subFn.bind(function () {
                        handler.call(fn);
                    });
                }
            }
            else {
                handlers.push(handler);
                handler.call(fn);
            }
        });

        fn.bindAsync = _(params_(String), Function, function (names, handler) {

            var processing = false;
            var asyncObject = {
                complete: function () {
                    processing = false;
                },
                cancel: null
            };

            fn.bind(names, asyncHandler);

            function asyncHandler() {
                if (processing)
                    asyncObject.cancel();
                else
                    processing = true;

                handler.call(fn, asyncObject);

                if (processing && typeof asyncObject.cancel != "function")
                    throw new Error("the cancel handler is required for async object when using bindAsync");
            }
        });

        fn.invokeOnchange = onchange;

        fn.toString = function () {
            return "drop.Node";
        };

        fn.valueOf = function () {
            var o = {};
            for (var i in node)
                if (hasOwnProperty.call(node, i))
                    o[i] = node[i].valueOf();
            return o;
        };

        if (isPlainObject(init))
            fn(init);

        return fn;

        function onchange() {
            for (var i = 0; i < handlers.length; i++)
                handlers[i].call(fn);
            onchildchange();
        }

    };

    this.JsonData = function (url, postData, contentType) {
        if (typeof url == "string")
            url = new drop.String(url);

        if (isPlainObject(postData))
            postData = drop.createData(postData);

        var data = new drop.Node();

        var fn = function (name) {
            return data(name);
        };

        fn.type = "node";
        fn.__vejisType__ = drop.Node;

        fn.ready = false;

        var bind = createBindMethod(fn, data.bind, true);
        var bindAsync = createBindMethod(fn, data.bindAsync, true);

        var onready = new Event();

        fn.bind = createDelayBindMethod(fn, bind, onready);
        fn.bindAsync = createDelayBindMethod(fn, bindAsync, onready);

        fn.invokeOnchange = data.invokeOnchange;

        fn.toString = function () {
            return "drop.JsonData";
        };
        fn.valueOf = data.valueOf;

        var requestData = new drop.Data();
        requestData.add("url", url);
        if (postData && typeof postData.invokeOnchange == "function")
            requestData.add("postData", postData);

        requestData.bindAsync(function (async) {
            var xhr = new XMLHttpRequest();
            if (postData == null) {
                xhr.open("get", this("url"));
                xhr.setRequestHeader("If-Modified-Since", 0);
                xhr.send(null);
            }
            else {
                contentType = contentType || "json";

                var content = buildPostContent(postData.valueOf(), contentType);

                xhr.open("post", this("url"));
                xhr.setRequestHeader("Content-Type", content.type);
                xhr.send(content.content);
            }

            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        data(eval("(" + xhr.responseText + ")"));
                        if (!fn.ready) {
                            fn.ready = true;
                            onready.fire();
                        }
                    }
                    async.complete();
                }
            };

            async.cancel = function () {
                try {
                    xhr.onreadystatechange = null;
                    xhr.abort();
                } catch (e) { }
            };
        });

        var interval;

        fn.setUpdateTime = _(Number, function (ms) {
            clearInterval(interval);
            if (ms > 0)
                interval = setInterval(url.invokeOnchange, ms);
        });

        return fn;
    };

    this.JsonpData = function (url, jsonp) {
        if (typeof url == "string")
            url = new drop.String(url);

        var data = new drop.Node();

        var fn = function (name) {
            return data(name);
        };

        fn.type = "node";
        fn.__vejisType__ = drop.Node;

        fn.ready = false;

        var bind = createBindMethod(fn, data.bind, true);
        var bindAsync = createBindMethod(fn, data.bindAsync, true);

        var onready = new Event();

        fn.bind = createDelayBindMethod(fn, bind, onready);
        fn.bindAsync = createDelayBindMethod(fn, bindAsync, onready);

        fn.invokeOnchange = data.invokeOnchange;

        fn.toString = function () {
            return "drop.JsonpData";
        };
        fn.valueOf = data.valueOf;

        url.bindAsync(function (async) {
            var script = document.createElement("script");
            script.async = "async";

            var drop = global.drop || (global.drop = {});
            var callback = "jsoncallback_" + Math.floor(Math.random() * (1 << 30));

            script.src = addQueryStringParam(this(), jsonp, "drop." + callback);
            var head = document.getElementsByTagName("head")[0];
            head.insertBefore(script, head.firstChild);

            drop[callback] = function (o) {
                data(o);
                if (!fn.ready) {
                    fn.ready = true;
                    onready.fire();
                }
                async.cancel();
                async.complete();
            };

            async.cancel = function () {
                if (script.parentNode)
                    script.parentNode.removeChild(script);
                delete drop[callback];
            };
        });

        var interval;

        fn.setUpdateTime = _(Number, function (ms) {
            clearInterval(interval);
            if (ms > 0)
                interval = setInterval(url.invokeOnchange, ms);
        });

        return fn;

        function addQueryStringParam(url, name, value) {
            return url + (url.indexOf("?") < 0 ? "?" : "&") + encodeURIComponent(name) + "=" + encodeURIComponent(value);
        }
    };

    this.String = function (template, data) {
        var re = /\{\{|\}\}|\{([\w\.]+)\}/g;

        var names = [];

        var strData = new drop.Value();

        var fn = function () {
            return strData();
        };

        fn.type = "value";
        fn.__vejisType__ = drop.Value;

        fn.bind = createBindMethod(fn, strData.bind, false);
        fn.bindAsync = createBindMethod(fn, strData.bindAsync, false);

        fn.invokeOnchange = strData.invokeOnchange;

        if (data)
            data.bind(build);
        else
            build();

        return fn;

        function build() {
            if (data) {
                var str = template.replace(re, function (m, name) {
                    if (data.type == "value") {
                        if (name) {
                            if (name == "value") return data.toString();
                            else return m;
                        }
                        else return m.substr(0, 1);
                    }
                    else {
                        if (name) return data(name);
                        else return m.substr(0, 1);
                    }
                });
                strData(str);
            }
            else strData(template);
        }
    };

    this.QueryString = function (data) {
        if (!data)
            throw new Error("data is required");

        var queryString;

        var fn = function () {
            return queryString;
        };

        fn.type = "value";
        fn.__vejisType__ = drop.Value;

        fn.bind = createBindMethod(fn, data.bind, false);
        fn.bindAsync = createBindMethod(fn, data.bindAsync, false);

        fn.invokeOnchange = data.invokeOnchange;

        fn.toString = function () { return queryString; };

        data.bind(build);

        return fn;

        function build() {
            queryString = buildQueryString(data.valueOf());
        }
    };

    function isPlainObject(o) {
        return o && o.constructor == Object;
    }

    function createBindMethod(o, bind) {
        return _(params_(String), Function, function (names, handler) {
            bind(names, function () {
                handler.apply(o, arguments);
            });
        });
    }

    function createDelayBindMethod(o, bind, onready) {
        return _(params_(String), Function, function (names, handler) {
            var args = arguments;
            if (o.ready)
                bind.apply(o, args);
            else {
                onready.add(function () {
                    bind.apply(o, args);
                });
                handler.call(o);
            }
        });
    }

    function buildPostContent(data, type) {
        switch (type) {
            case "json":
            case "application/json":
                return {
                    type: "application/json",
                    content: JSON.stringify(data)
                };
            case "url":
            case "application/x-www-form-urlencoded":
                return function () {
                    var queryString = buildQueryString(data);
                    return {
                        type: "application/x-www-form-urlencoded",
                        content: queryString
                    };
                } ();
            default:
                return {
                    type: type,
                    data: data
                };
        }
    }

    function buildQueryString(data) {
        var strs = [];
        for (var i in data)
            if (hasOwnProperty.call(data, i))
                strs.push(encodeURIComponent(i) + "=" + encodeURIComponent(data[i]));
        return strs.join("&");
    }

    function Event() {
        var listeners = [];

        this.add = function (listener) {
            listeners.push(listener);
        };

        this.fire = function () {
            for (var i = 0; i < listeners.length; i++)
                try {
                    listeners[i]();
                } catch (e) { }
        };
    }
});