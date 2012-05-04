/*
    VEJIS 0.4
    by VILIC VANE
    www.vilic.info
*/

"vejis object",
function () {

    //////////////////////
    // COMMON VARIABLES //
    //////////////////////

    //global variable
    var global = (function () { return this; })();
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var splice = Array.prototype.splice;
    var push = Array.prototype.push;

    ////////////////////
    // COMMON METHODS //
    ////////////////////

    function copy(from, to, overwrite) {
        if (overwrite) {
            forin_(from, function (v, i) {
                to[i] = v;
            });
        }
        else {
            forin_(from, function (v, i) {
                if (!(i in to)) to[i] = v;
            });
        }
    }

    function createMap() {
        var keys = [];
        var values = [];

        return function (key, value) {
            for (var i = 0; i < keys.length; i++)
                if (keys[i] === key) {
                    if (arguments.length == 2)
                        values[i] = value;
                    return values[i];
                }

            if (arguments.length == 2) {
                keys.push(key);
                values.push(value);
            }

            return undefined;
        };
    }

    function createStringMap() {
        var map = {};
        var m = function (key, value) {
            key = "#" + key;
            if (arguments.length == 2)
                map[key] = value;
            return map[key];
        };

        m.remove = function (key) {
            delete map["#" + key];
        };

        return m;
    }

    //throw an error
    function error(msg) {
        throw new Error(msg);
    }

    //log
    function log(msg) {
        if (global.console)
            console.log(msg);
    }

    /* DEFINES */
    function PlainObject() { return {}; }

    //determine weather an object is an instance of a class
    function is_(object, Type) {
        if (typeof Type != "function")
            error('the "Type" must be a function.');

        if (Type == PlainObject && typeof object == "object" && object && object.constructor == Object)
            return true;

        if (Type === Object) return true;

        switch (typeof object) {
            case "object":
            case "function":
            case "undefined":
                return object instanceof Type;
            default:
                return new object.constructor() instanceof Type;
        }
    }

    function for_(array, loop) {
        if (typeof loop != "function")
            error('the "loop" must be a function.');
        if (!(array && array.length))
            return true;
        for (var i = 0; i < array.length; i++)
            if (loop.call(this, array[i], i, array.length) === false)
                return false;
        return true;
    }

    function forin_(object, loop) {
        if (typeof loop != "function")
            error('the "loop" must be a function.');
        if (!object)
            return true;
        for (var i in object)
            if (hasOwnProperty.call(object, i))
                if (loop.call(this, object[i], i) === false)
                    return false;
        return true;
    }

    function enum_(params_name) {
        var items = arguments;
        var re = /[a-z_\$][a-z0-9_\$]*/i;

        for (var i = 0; i < items.length; i++)
            if (typeof items[i] != "string" || !re.test(items[i]))
                error("the name of possible values of for enum must be string.");

        for (var i = 0; i < items.length; i++)
            Enum[items[i]] = new Enum(items[i]);

        return Enum;
        function Enum(name) {
            this.toString = function () { return name; };
        }
    };


    /* SIGN TO GLOBAL */
    global.PlainObject = PlainObject;
    global.is_ = is_;
    global.for_ = for_;
    global.forin_ = forin_;
    global.enum_ = enum_;

    ////////////////////////
    // METHOD OVERLOADING //
    ////////////////////////

    "method overloading",
    function () {

        /* METHOD DEFINES */

        //define a method
        function _(params_Type, fn) {
            var overloads = new Overloads();

            var method = function () {
                var overload = overloads.getOverload(arguments);
                if (!overload)
                    return error("no overload of this mathod matches the arguments given.");

                var fn = overload.fn;
                var pStart = overload.pStart;
                var pCount = overload.pCount;

                var args = [];
                //if no params type, no pack...
                if (pStart < 0)
                    for (var i = 0; i < arguments.length; i++)
                        args.push(arguments[i]);
                //else, pack params type to an array.
                else {
                    for (var i = 0; i < pStart; i++)
                        args.push(arguments[i]);
                    var params = [];
                    for (var i = 0; i < pCount; i++)
                        params.push(arguments[pStart + i]);
                    args.push(params);
                    for (var i = pStart + pCount; i < arguments.length; i++)
                        args.push(arguments[i]);
                }

                return fn.apply(this, args);
            };

            method._ = function (params_Type, fn) {
                if (arguments.length == 0)
                    return error("at least one argument is required.");

                var that = this;
                var Types = [];

                var lastIndex = arguments.length - 1;
                var paramsIndex;

                for (var i = 0; i < lastIndex; i++) {
                    var arg = arguments[i];
                    if (typeof arg != "function")
                        return error("type must be a function");

                    if (arg.prototype == Option.prototype) (function (args) {
                        var values = [];
                        for (var j = i; j < lastIndex; j++) {
                            try {
                                values.push(args[j].value);
                            }
                            catch (e) {
                                alert(args.join("\n"));
                            }
                        }

                        method._.apply(that, Types.concat(function () {
                            var rArgs = [];
                            for (var k = 0; k < arguments.length; k++) {
                                if (k == paramsIndex)
                                    push.apply(rArgs, arguments[k]);
                                else
                                    rArgs.push(arguments[k]);
                            }
                            push.apply(rArgs, values);
                            return method.apply(this, rArgs);
                        }));

                        arg = arg.Type;
                    })(arguments);

                    Types.push(arg);
                }

                fn = arguments[lastIndex];
                if (typeof fn != "function")
                    return error("fn must be a function");

                var list = new TypeList(Types);
                paramsIndex = list.paramsIndex;

                overloads.addOverload(fn, list);
            };

            if (arguments.length > 0)
                method._.apply(this, arguments);

            return method;
        }

        //params
        function params_(Type) {
            //the class name "Params" here is for debugging
            //so that, when something went wrong, you can see
            //it's a params type
            var ParamsType = function () { return function Params() { }; } ();
            ParamsType.prototype = Params.prototype;
            ParamsType.Type = Type;
            return ParamsType;
        }

        function option_(Type, value) {
            if (arguments.length == 1) {
                switch (Type) {
                    case Number:
                        value = 0;
                        break;
                    case String:
                        value = "";
                        break;
                    default:
                        value = new Type();
                        break;
                }
            }
            if (!is_(value, Type))
                return error("the value doesn't match the type given");
            var OptionType = function () { return function Option() { }; } ();
            OptionType.prototype = Option.prototype;
            OptionType.Type = Type;
            OptionType.value = value;
            return OptionType;
        }

        /* SIGN TO GLOBAL */
        global._ = _;
        global.params_ = params_;
        global.option_ = option_;

        function Overloads() {
            var lists = [];
            //var hasParamsIndex = 0;

            this.addOverload = function (fn, nList) {
                for (var i = 0; i < lists.length; i++) {
                    var list = lists[i].typeList;
                    if (!canBeDistinguished(list, nList))
                        return error("the adding overload can't be distinguished from existing ones.");
                }

                lists.push({
                    typeList: nList,
                    fn: fn
                });
            };

            this.getOverload = function (args) {
                for (var i = 0; i < lists.length; i++) {
                    var list = lists[i];
                    var typeList = list.typeList;
                    var pStart = typeList.paramsIndex;
                    var pCount = args.length - typeList.Types.length + 1;
                    if (doesMatchArguments(typeList, args))
                        return {
                            fn: list.fn,
                            pStart: pStart,
                            pCount: pCount
                        };
                }

                return null;
            };


        }

        function getIndexOfParams(Types) {
            for (var i = 0; i < Types.length; i++)
                if (Types[i].prototype == Params.prototype)
                    return i;
            return -1;
        }

        function doesMatchArguments(typeList, args, copy) {

            var Types = typeList.Types;
            var pi = typeList.paramsIndex;
            var pT = typeList.ParamsType;
            var tlen = Types.length;
            var alen = args.length;

            //if no params type
            if (typeList.paramsIndex < 0) {
                //if lengths are not the same, then...
                if (tlen != alen)
                    return false;

                //else compare every args.
                for (var i = 0; i < alen; i++) {
                    var arg = args[i];
                    if (!is_(arg, Types[i]))
                        return false;
                }

                return true;
            }
            //if exist params type
            else {
                //if the length of arguments is even smaller than
                //the length of type list minus 1... then...
                if (alen < tlen - 1)
                    return false;

                //else...

                //1. expand the type list to the same length of arguments.
                typeList = expandList(typeList, alen);
                Types = typeList.Types;

                //2. compare them...
                for (var i = 0; i < alen; i++) {
                    var arg = args[i];
                    if (!is_(arg, Types[i]))
                        return false;
                }

                return true;
            }
        }

        function canBeDistinguished(listA, listB) {
            var ai = listA.paramsIndex;
            var bi = listB.paramsIndex;
            var aTypes = listA.Types;
            var bTypes = listB.Types;
            var ParamsTypeA = listA.ParamsType;
            var ParamsTypeB = listB.ParamsType;
            var alen = aTypes.length;
            var blen = bTypes.length;

            //both without params type.
            if (ai < 0 && bi < 0) {
                //if the lengths are different, then they can
                //of course be distinguished.
                if (alen != blen)
                    return true;

                //else, compare every type in the list.
                for (var i = 0; i < alen; i++) {
                    //if one of the list types are not related,
                    //then they can be distinguished
                    if (!isRelatedTypes(aTypes[i], bTypes[i]))
                        return true;
                }

                //if all of the types in two lists are related,
                //then they couldn't be distinguished.
                return false;
            }

            //one of the lists has params type,
            if (ai < 0 && bi >= 0) {
                //but the length of it minus 1 is still larger than
                //the other one's, so that the lengths will always
                //be different.
                if (alen < blen - 1)
                    return true;

                //expand list B to make its length the same as list A
                listB = expandList(listB, alen);
                return canBeDistinguished(listA, listB);
            }
            if (ai >= 0 && bi < 0) {
                if (alen - 1 > blen)
                    return true;
                listA = expandList(listA, blen);
                return canBeDistinguished(listA, listB);
            }

            //now the most troublesome part.
            //both of the lists have params type.

            //compare start.
            var sc = Math.min(ai, bi);
            for (var i = 0; i < sc; i++)
                if (!isRelatedTypes(aTypes[i], bTypes[i]))
                    return true;

            //compare end.
            var ec = Math.min(alen - ai - 1, blen - bi - 1);
            for (var i = 0; i < ec; i++) {
                var j = alen - i - 1;
                var k = blen - i - 1;
                if (!isRelatedTypes(aTypes[j], bTypes[k]))
                    return true;
            }

            //compare the types will always be compare with params type.
            //"-" stands for params type, "=" stands for normal ones.
            //1. ...[=]-[==]...
            //   ...[-]-[--]...
            //2. ...==-[-]...
            //   ...-==[=]...

            //the params type will be compared will always be the shorter one.

            //1. both ends of the type list will be compared.

            //2. only one side of the list will be compared.

            if (alen > blen) {
                //list A start
                for (var i = sc; i < ai; i++)
                    if (!isRelatedTypes(aTypes[i], ParamsTypeB))
                        return true;

                //list A end
                for (var i = ai + 1; i < alen - ec; i++)
                    if (!isRelatedTypes(aTypes[i], ParamsTypeB))
                        return true;
            }
            else {
                //list B start
                for (var i = sc; i < bi; i++)
                    if (!isRelatedTypes(ParamsTypeA, bTypes[i]))
                        return true;

                //list B end
                for (var i = bi + 1; i < blen - ec; i++)
                    if (!isRelatedTypes(ParamsTypeA, bTypes[i]))
                        return true;
            }

            //then there would be only two possibilities in middle.
            //1. -
            //   -
            //2. ==-
            //   -==
            var count = Math.min(alen, blen) - sc - ec - 1; //remain count ignoring params type
            if (sc == bi)
                return comparePN(aTypes, sc, ParamsTypeA, bTypes, sc + 1, ParamsTypeB, count);
            else
                return comparePN(bTypes, sc, ParamsTypeB, aTypes, sc + 1, ParamsTypeA, count);

            //a comparing loop to compare the rest of the types in list.
            function comparePN(aTypes, aStart, aPT, bTypes, bStart, bPT, count) {
                if (count == 0)
                    return false;

                var withN = false;
                var withP = false;

                //compare with normal types
                for (var i = 0, j = aStart, k = bStart; i < count; i++, j++, k++)
                    if (!isRelatedTypes(aTypes[j], bTypes[k])) {
                        withN = true;
                        break;
                    }

                //compare with params one
                //if
                //[=]=[-]
                //[-]=[=]
                //are related, then we still don't know in this condition,
                //whether the two type lists can be distinguished.
                if (isRelatedTypes(aTypes[aStart], bPT) && isRelatedTypes(aPT, bTypes[bStart + count - 1]))
                    withP = comparePN(aTypes, aStart + 1, aPT, bTypes, bStart, bPT, count - 1);
                //else, they can be distinguished.
                else
                    withP = true;

                return withN && withP;
            }
        }

        //expand a type list with params type to a specific length,
        //and it will remove params type.
        function expandList(list, length) {
            var Types = list.Types.concat();
            var paramsIndex = list.paramsIndex;
            var ParamsType = list.ParamsType;

            var args = [paramsIndex, 1];
            length -= Types.length - 1;

            for (var i = 0; i < length; i++)
                args.push(ParamsType);

            //remove original params type and add the type difined
            //by params type.
            splice.apply(Types, args);
            //reset the params index and type.
            return new TypeList(Types);
        }

        function isRelatedTypes(TypeA, TypeB) {
            return (
                TypeA.prototype instanceof TypeB || TypeA.prototype == TypeB.prototype ||
                TypeB.prototype instanceof TypeA || TypeB.prototype == TypeA.prototype
            );
        }

        function TypeList(Types) {
            this.Types = Types;
            this.paramsIndex = getIndexOfParams(Types);
            this.ParamsType = this.paramsIndex < 0 ? null : Types[this.paramsIndex].Type;
        }

        //a base class, see "params_" method
        function Params() { }

        //a base class, see "option_" method
        function Option() { }
    } ();


    /////////////////////
    // CLASS ENHANCING //
    /////////////////////

    "class enhancing",
    function () {
        var infos = createMap();

        /* METHOD DEFINE */

        //create a class
        var class_ = _(Function, function (body) {
            var BaseClass, staticBody, ClassBody;
            ClassBody = body;

            var pri = {};
            var info = {
                pri: pri,
                ClassBody: ClassBody,
                staticBody: null,
                baseInfo: null
            };

            var first = true;


            var C = function () {
                if (first) {
                    first = false;
                    delete C.static_;
                    delete C.inherit_;
                }

                var that = this;

                var ClassBodys = [];
                var baseInfo = info.baseInfo;

                if (baseInfo) {
                    do
                        ClassBodys.unshift(baseInfo.ClassBody);
                    while (baseInfo = baseInfo.baseInfo);
                }

                for_(ClassBodys, function (body) {
                    that._ = function () {
                        delete this._;
                    };
                    body.call(this, C, pri);
                });

                var constructor;

                this._ = function () {
                    if (!constructor)
                        constructor = _.apply(this, arguments);
                    else
                        constructor._.apply(this, arguments);
                };

                body.call(this, C, pri);

                delete this._;

                if (constructor)
                    constructor.apply(this, arguments);
            };

            infos(C, info);

            C.static_ = _(Object, function (body) {
                delete C.static_;
                info.staticBody = staticBody = body;

                buildStatic(C, pri, body, true);

                return C;
            });

            C.inherit_ = _(Function, function (Class) {
                delete C.inherit_;
                info.BaseClass = BaseClass = Class;
                C.prototype = Class.prototype;

                var baseInfo = infos(Class);

                if (baseInfo) {
                    info.baseInfo = baseInfo;
                    do
                        buildStatic(C, pri, baseInfo.staticBody, false);
                    while (baseInfo = baseInfo.baseInfo);
                }

                return C;
            });

            return C;

        });

        var static_class_ = _(Object, function (body) {
            return class_(function () { }).static_.call(this, body);
        });

        /* SIGN TO GLOBAL */
        global.class_ = class_;
        global.static_class_ = static_class_;

        function buildStatic(pub, pri, staticBody, overwrite) {
            if (typeof staticBody == "function") {
                var o = {
                    private_: function (priBody) {
                        if (typeof priBody != "object")
                            error('the "body" must be an object.');
                        delete o.private_;
                        copy(priBody, pri, overwrite);
                    },
                    public_: function (pubBody) {
                        if (typeof pubBody != "object")
                            error('the "body" must be an object.');
                        delete o.public_;
                        copy(pubBody, pub, overwrite);
                    }
                };

                staticBody.call(o, pub, pri);
            }
            else copy(staticBody, pri, overwrite);
        }

    } ();


    ///////////////
    // NAMESPACE //
    ///////////////

    "module",
    function () {
        var readyModules = createStringMap(); //stores names of ready modules
        var useQueue = createStringMap();

        /* METHOD DEFINE */

        //import namespace
        var using_ = _(params_(PlainObject), function (namespaces) {
            var items = [];
            for_(namespaces, function (namespace) {
                forin_(namespace, function (property, name) {
                    items.push({
                        name: name,
                        status: hasOwnProperty.call(global, name),
                        value: global[name]
                    });

                    global[name] = property;
                });
            });

            //restore handler
            return function () {
                for_(items, function (item) {
                    var name = item.name;
                    if (hasOwnProperty.call(global, name)) {
                        if (item.status)
                            global[name] = item.value;
                        else
                            delete global[name];
                    }
                });
            };
        });

        using_._(params_(PlainObject), Function, function (namespaces, body) {
            var restore = using_.apply(this, namespaces);
            body.call(this);
            restore();
        });

        //create a module

        var module_ = _(String, Array, Function, function (name, attaches, body) {
            if (readyModules(name))
                return console.warn('module "' + name + '" already loaded');

            log('loaded module "' + name + '"');

            var module = readyModules(name, {});
            body.apply(module, attaches);

            var queueHandlers = useQueue(name);
            if (queueHandlers)
                for (var i = 0; i < queueHandlers.length; i++) {
                    var handler = queueHandlers[i];
                    var more = handler(module);
                    if (!more)
                        queueHandlers.splice(i--, 1);
                }
        });

        module_._(String, Function, function (name, body) {
            return module_(name, [], body);
        });

        //use a module
        var use_ = _(params_(String), Function, function (names, handler) {
            var that = this;

            var modules = [];
            var indexes = createStringMap();

            var queueCount = 0;

            for_(names, function (name, i) {
                var module = readyModules(name);
                if (module)
                    modules[i] = module;
                else {
                    indexes(name, i);

                    var q = useQueue(name);
                    if (!q)
                        q = useQueue(name, []);

                    q.push(function (module) {
                        return queueHandler(name, module);
                    });

                    queueCount++;
                }
            });

            if (queueCount == 0) ready();

            function queueHandler(name, module) {
                var i = indexes(name);
                if (modules[i]) return;
                modules[i] = module;
                queueCount--;
                if (queueCount == 0) {
                    ready();
                    return false;
                }
                else return true;
            }

            function ready() {
                handler.apply(that, modules);
            }
        });

        use_._(params_(String), function (names) {

            var moduleName;
            var moduleBody;

            var args = names.concat(function () {
                if (!moduleName) return;

                var modules = [];
                for_(arguments, function (module) {
                    modules.push(module);
                });

                module_(moduleName, modules, moduleBody);
            });

            return {
                module_: _(String, Function, function (name, body) {
                    moduleName = name;
                    moduleBody = body;
                    use_.apply(this, args);
                })
            };
        });

        //require a file
        var requiredFiles = {};

        var require_ = _(params_(String), function (files) {
            var head = document.getElementsByTagName("head")[0];
            for_(files, function (file) {
                if (hasOwnProperty.call(requiredFiles, file))
                    return;

                requiredFiles[file] = true;
                var script = document.createElement("script");
                script.async = "async";
                script.src = file;
                head.insertBefore(script, head.firstChild);
                //setTimeout(function () { head.removeChild(script); }, 0);
            });
        });

        /* SIGN TO GLOBAL */
        //global.namespace_ = namespace_;
        //global.use_ = use_;
        //global.require_ = require_;

        global.using_ = using_;
        global.module_ = module_;
        global.use_ = use_;
        global.require_ = require_;

    } ();





} ();