/* VEJIS v0.5.0.1 http://vejis.org */

"VEJIS",
function () {

    /* COMMON VARIABLES */

    var global = function () { return this; }();
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var slice = Array.prototype.slice;

    /* COMMON METHODS */

    function error() { throw new Error(); }

    function copy(from, to, overwrite) {
        if (overwrite) {
            for (var i in from) {
                if (hasOwnProperty.call(from, i))
                    to[i] = from[i];
            }
        }
        else {
            for (var i in from) {
                if (hasOwnProperty.call(from, i) && !hasOwnProperty.call(to, i))
                    to[i] = from[i];
            }
        }
    }

    function createStringMap() {
        var map = {};
        var m = function (key, value) {
            if (arguments.length == 2)
                map[key] = value;
            return hasOwnProperty.call(map, key) ? map[key] : undefined;
        };

        return m;
    }

    function is_(object, Type) {
        if (object && object.__relatedInstance__)
            object = object.__relatedInstance__;

        if (Type.__isInstance__)
            return Type.__isInstance__(object);

        if (object != null && Type === Object)
            return true;

        switch (typeof object) {
            case "object":
            case "function":
                if (object) {
                    var constructor = object.constructor;
                    while (constructor) {
                        if (constructor == Type || constructor.prototype instanceof Type)
                            return true;
                        try{ constructor = constructor.__classInfo__.inheritInfo.Class; }
                        catch (e) { constructor = null; }
                    }
                }
            case "undefined":
                return object instanceof Type;
            default:
                //for string, number and boolean
                return new object.constructor() instanceof Type;
        }
    }

    function isType(Type) {
        return (
            typeof Type == "function" ||
            typeof Type == "object" && !!Type && !!Type.__isInstance__
        );
    }

    function isTypeMark(TypeMark) {
        return (
            typeof TypeMark == "object" &&
            !!TypeMark && typeof TypeMark.__type__ == "number"
        );
    }

    /* VEJIS METHOD OVERLOADING */

    var ParamType = {
        normal: 0,
        option: 1,
        params: 2,
        delegate: 3
    };

    function opt_(Type, defaultValue) {
        if (arguments.length == 1) {
            switch (Type) {
                case Number:
                case Integer:
                    defaultValue = 0;
                    break;
                case String:
                    defaultValue = "";
                    break;
                case Boolean:
                    defaultValue = false;
                    break;
                case Object:
                case PlainObject:
                    defaultValue = {};
                    break;
                case Array:
                    defaultValue = [];
                    break;
                default:
                    if (Type.__relatedType__ == List)
                        defaultValue = [];
                    else if (Type.__nullable__)
                        defaultValue = null;
                    else {
                        error();
                        return;
                    }
                    break;
            }
        }

        return {
            __type__: ParamType.option,
            RelatedType: Type,
            defaultValue: defaultValue
        };
    }

    function params_(Type) {
        return {
            __type__: ParamType.params,
            RelatedType: Type
        };
    }

    function nul_(Type) {
        return {
            __type__: ParamType.normal,
            __nullable__: true,
            __isInstance__: function (object) {
                return object == null || is_(object, Type); // returns true when object is undefined.
            }
        };
    }

    function delegate_() {
        var delegate = {
            __type__: ParamType.delegate,
            __isInstance__: function (object) {
                return typeof object == "function";
            },
            with_: function () {
                delete delegate.with_;
                delete delegate.bind_;
                return delegate;
            },
            bind_: function (object) {
                delegate.__relatedThisObject__ = { value: object };
                delete delegate.with_;
                delete delegate.bind_;
                return delegate;
            },
            as_: function () {
                delete delegate.as_;
                return delegate;
            }
        };

        return delegate;
    }

    function _(params_Type, fn) {
        var collection = new OverloadCollection();

        var method = function () {
            return collection.exec(this, arguments);
        };

        method._ = function (params_Type, fn) {
            var Types = [];
            var typesLength = arguments.length - 1;
            for (var i = 0; i < typesLength; i++)
                Types.push(arguments[i]);

            fn = arguments[typesLength];

            var overload = new Overload(Types, fn);

            collection.add(overload);

            method.as_ = function (Type) {
                delete method.as_;
                return method;
            };

            method.with_ = function (Type) {
                overload.ThisType = Type;
                delete method.with_;
                delete method.bind_;
                return method;
            };

            method.bind_ = function (object) {
                overload.thisObject = { value: object };
                delete method.with_;
                delete method.bind_;
                return method;
            };

            method.static_ = function (staticObject) {
                overload.staticObject = staticObject;

                for (var i = 0; i < params.length; i++)
                    params[i].name = names[i + 1];

                delete method.static_;
                return method;
            };

            return method;
        };

        method.toString = function () {
            return collection.toString();
        };

        if (arguments.length)
            method._.apply(method, arguments);

        return method;
    }

    global._ = _;
    global.opt_ = opt_;
    global.params_ = params_;
    global.nul_ = nul_;
    global.delegate_ = delegate_;

    function Overload(Types, fn) {
        this.Types = Types;
        this.thisObject = undefined;
        this.ThisType = undefined;
        this.staticObject = undefined;

        var required = [];
        var optional = [];
        var ParamsRelatedType;

        var length = Types.length;
        var optionalIndex = 0;

        //types must be in this order:
        //[...][option[option[option...]]][params][...]
        var status = 0;

        for (var i = 0; i < length; i++) {
            var Type = this.Types[i];
            var paramType =
                typeof Type == "function" ?
                    ParamType.normal :
                    Type ? Type.__type__ || ParamType.normal : undefined;
                
            switch (paramType) {
                case ParamType.normal:
                case ParamType.delegate:
                    if (status == 0)
                        optionalIndex++;
                    else if (status < 3)
                        status = 3;
                    required.push(Type);
                    break;
                case ParamType.option:
                    if (status < 1)
                        status = 1;
                    optional.push(Type);
                    break;
                case ParamType.params:
                    if (status < 2) {
                        status = 2;
                        ParamsRelatedType = Type.RelatedType;
                    }
                    break;
            }
        }

        this.exec = function (thisArg, args) {
            var result = {
                match: false,
                value: undefined
            };

            if (this.ThisType && !is_(thisArg, this.ThisType))
                return result;

            if (this.thisObject)
                thisArg = this.thisObject.value;

            var diff = args.length - required.length;

            if (
                diff < 0 ||
                (!ParamsRelatedType && diff > optional.length)
            ) return result;

            var destArgs = [];

            if (this.staticObject)
                destArgs.push(this.staticObject);

            // the first part of required.
            for (var i = 0; i < optionalIndex; i++) {
                var arg = args[i];
                var Type = required[i];

                if (!is_(arg, Type))
                    return result;

                if (
                    Type.__type__ == ParamType.delegate &&
                    Type.__relatedThisObject__
                ) (function () {
                    var fn = arg;
                    var thisArg = Type.__relatedThisObject__.value;
                    arg = function () {
                        fn.apply(thisArg, arguments);
                    };
                })();

                destArgs.push(arg);
            }

            // the optional part.
            var opLength = Math.min(diff, optional.length);
            for (var i = 0; i < optional.length; i++) {
                var arg =
                    i < opLength ?
                    args[i + optionalIndex] :
                    optional[i].defaultValue;

                var Type = optional[i].RelatedType;

                if (!is_(arg, Type))
                    return result;

                if (
                    Type.__type__ == ParamType.delegate &&
                    Type.__relatedThisObject__
                ) (function () {
                    var fn = arg;
                    var thisArg = Type.__relatedThisObject__.value;
                    arg = function () {
                        fn.apply(thisArg, arguments);
                    };
                })();

                destArgs.push(arg);
            }

            // the params part.
            var paEnd = diff + optionalIndex;
            var paLength = diff - opLength;
            var paStart = optionalIndex + opLength;

            if (paLength == 1 && is_(args[paStart], List(ParamsRelatedType)))
                destArgs.push(slice.call(args[paStart]));
            else if (ParamsRelatedType) {
                var paArray = [];
                for (var i = paStart; i < paEnd; i++) {
                    var arg = args[i];
                    var Type = ParamsRelatedType;

                    if (!is_(arg, Type))
                        return result;

                    if (
                        Type.__type__ == ParamType.delegate &&
                        Type.__relatedThisObject__
                    ) (function () {
                        var fn = arg;
                        var thisArg = Type.__relatedThisObject__.value;
                        arg = function () {
                            fn.apply(thisArg, arguments);
                        };
                    })();

                    paArray.push(arg);
                }
                destArgs.push(paArray);
            }

            // the second part of required.
            for (var i = optionalIndex; i < required.length; i++) {
                var arg = args[i + diff];
                var Type = required[i];

                if (!is_(arg, Type))
                    return result;

                if (
                    Type.__type__ == ParamType.delegate &&
                    Type.__relatedThisObject__
                ) (function () {
                    var fn = arg;
                    var thisArg = Type.__relatedThisObject__.value;
                    arg = function () {
                        fn.apply(thisArg, arguments);
                    };
                })();

                destArgs.push(arg);
            }

            var value = fn.apply(thisArg, destArgs);

            result.match = true;
            result.value = value;

            return result;
        };
    }

    function OverloadCollection() {
        var list = [];

        this.add = function (overload) {
            list.push(overload);
        };

        this.exec = function (thisArg, args) {
            var value;
            for (var i = 0; i < list.length; i++) {
                var result = list[i].exec(thisArg, args);
                if (result.match)
                    return result.value;
            }
        };
    }

    /* EXTENDED TYPES */
    var IList = interface_("IList", {
        length: Integer
    });

    function PlainObject() { return {}; }
    PlainObject.__isInstance__ = function (object) {
        return !!object && typeof object == "object" && object.constructor == Object;
    };

    function List(Type) {
        return {
            __isInstance__: function (object) {
                if (!is_(object, Array)) return false;

                for (var i = 0; i < object.length; i++) {
                    var item = object[i];
                    if (!is_(item, Type))
                        return false;
                }

                return true;
            },
            __relatedType__: List
        };
    }

    function Type() {
        return {
            __relatedInstance__: function () { }
        };
    }
    Type.__isInstance__ = function (object) {
        return isType(object);
    };

    function Integer(n) { return new Number(arguments.length > 0 ? Math.floor(n) : 0); }
    Integer.__isInstance__ = function (object) {
        return typeof object == "number" && object % 1 == 0;
    };

    global.PlainObject = PlainObject;
    global.IList = IList;
    global.List = List;
    global.Type = Type;
    global.Integer = Integer;

    global.is_ = is_;

    /* OTHER EXTENDED METHODS */

    global.for_ = _(IList, Function, function for_(array, handler) {
        for (var i = 0; i < array.length;) {
            var result = handler(array[i], i, array.length);
            if (result === false)
                return false;
            else if (typeof result == "number")
                i += result;
            else
                i++;
        }
        return true;
    });

    global.for_._(params_(IList), Function, function (arrays, handler) {
        var indexes = [];
        var items = [];

        var i;
        for (var i = 0; i < arrays.length; i++) {
            if (arrays[i].length == 0)
                return true;
            indexes[i] = 0;
            items[i] = arrays[i][0];
        }

        do {
            var result = handler.apply(null, items);

            if (result === false)
                return false;

            for (i = arrays.length - 1; i >= 0; i--) {
                indexes[i]++;
                if (indexes[i] < arrays[i].length) {
                    items[i] = arrays[i][indexes[i]];
                    break;
                }
                else {
                    indexes[i] = 0;
                    items[i] = arrays[i][0];
                }
            }
        }
        while (i >= 0);

        return true;
    });

    global.forin_ = function (object, handler) {
        for (var i in object)
            if (hasOwnProperty.call(object, i))
                if (handler(object[i], i) === false)
                    return false;
        return true;
    };

    function enum_(name, items) {
        var count = items.length;

        function Enum(name, value) {
            this.toString = function () { return name; };
            this.valueOf = function () { return value; };
            this.test = _(Enum, function (value) { return !!(this & value); });
        }

        Enum.__isInstance__ = function (object) {
            return (
                object instanceof Enum ||
                is_(object, Integer) && object < 1 << count + 1
            );
        };

        for (var i = 0; i < count; i++)
            var ele = Enum[items[i]] = new Enum(items[i], 1 << i);

        return Enum;
    }

    global.enum_ = _(String, List(String), enum_);
    global.enum_._(params_(String), function (items) {
        return enum_("", items);
    });

    /* VEJIS CLASS ENHANCING */

    function class_(name, ClassBody) {
        var pri = {};

        var info = {
            inheritInfo: undefined,
            staticBody: undefined,
            ClassBody: ClassBody,
            Class: undefined
        };

        var relatedInstance;
        var theInterface;

        var Class = function () {
            var that = this;

            var ClassBodies = [];
            var inheritInfo = info;

            while (inheritInfo = inheritInfo.inheritInfo)
                ClassBodies.unshift(inheritInfo.ClassBody);

            this._ = function () { };

            for (var i = 0; i < ClassBodies.length; i++) {
                var ins = ClassBodies[i].call(this, Class, pri);
                if (ins) {
                    var type = typeof ins;
                    if (type == "function" || type == "object")
                        copy(ins, this, true);
                }
            }

            var constructor;

            this._ = function (params_Type, fn) {
                if (!constructor)
                    constructor = _.apply(this, arguments).bind_(this);
                else
                    constructor._.apply(this, arguments).bind_(this);
            };

            var ins = ClassBody.call(this, Class, pri);

            delete this._;

            if (constructor)
                constructor.apply(this, arguments);

            if (ins) {
                var type = typeof ins;
                if (type == "function" || type == "object") {
                    copy(this, ins, false);
                    ins.constructor = Class;
                }
            }

            return ins;
        };

        Class.__name__ = name;
        Class.__classInfo__ = info;

        Class.static_ = _(PlainObject, function (body) {
            delete Class.static_;
            info.staticBody = body;

            copy(body, pri, true);

            return Class;
        });

        Class.static_._(Function, function (body) {
            delete Class.static_;
            info.staticBody = body;

            buildStatic(Class, pri, body, true);

            return Class;
        });

        Class.inherit_ = _(Function, function (BaseClass) {
            delete Class.inherit_;

            var inheritInfo = BaseClass.__classInfo__;
            
            if (inheritInfo) {
                info.inheritInfo = inheritInfo;

                do {
                    var staticBody = inheritInfo.staticBody;
                    if (typeof staticBody == "function")
                        buildStatic(Class, pri, staticBody, false);
                    else
                        copy(staticBody, pri, false);
                }
                while (inheritInfo = inheritInfo.inheritInfo);
            }
            else {
                info.inheritInfo = {
                    ClassBody: BaseClass,
                    Class: BaseClass
                };
            }
            
            return Class;
        });

        Class.inherit_._(Interface, function (Interface) {
            delete Class.inherit_;
            theInterface = Interface;

            return Class;
        });

        info.Class = Class;

        return Class;
    }

    function buildStatic(pub, pri, staticBody, overwrite) {
        var o = {
            private_: _(PlainObject, function (priBody) {
                delete o.private_;
                copy(priBody, pri, overwrite);
            }),
            public_: _(PlainObject, function (pubBody) {
                delete o.public_;
                copy(pubBody, pub, overwrite);
            })
        };

        staticBody.call(o, pub, pri);
    }

    global.class_ = _(opt_(String), Function, class_);

    function interface_(name, body) {
        var list = [];
        var hash = {};

        for (var i in body) {
            if (hasOwnProperty.call(body, i)) {
                var Type = body[i];
                list.push({
                    name: i,
                    Type: Type
                });
                hash[i] = true;
            }
        }

        var theInterface = new Interface();

        theInterface.__isInstance__ = function (object) {
            if (!object) return false;

            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                if (!is_(object[item.name], item.Type))
                    return false;
            }

            return true;
        };
        theInterface.__list__ = list;
        theInterface.inherit_ = function (target) {
            /// <param name="target" type="Interface">the interface to inherit.</param>

            var pList = target.__list__ || [];
            for (var i = 0; i < pList.length; i++) {
                var item = pList[i];
                if (!hasOwnProperty.call(hash, item.name)) {
                    list.push(item);
                    hash[item.name] = true;
                }
            }

            return theInterface;
        };

        return theInterface;
    }

    function Interface() { }

    global.Interface = Interface;
    global.interface_ = _(opt_(String), PlainObject, interface_);

    /* VEJIS MODULE SYSTEM */

    var moduleInvoker = new function () {
        var infos = createStringMap();

        this.addUse = addUse;

        function addUse(names, handler) {
            var remain = names.length;
            var modules = [];

            for (var i = 0; i < names.length; i++) (function (i) {
                var info = getInfo(names[i]);

                if (info.ready)
                    callback();
                else
                    info.callbacks.push(callback);

                function callback() {
                    modules[i] = info.module;
                    remain--;
                    if (remain == 0)
                        invoke();
                }
            })(i);

            function invoke() {
                try {
                    handler.apply(null, modules);
                }
                catch (e) {
                    error(e);
                    return;
                }
            }
        }

        this.addModule = function (name, parts, builder) {
            var info = getInfo(name);

            var module = info.module;

            if (info.created)
                return;

            info.created = true;

            if (builder)
                builder.call(module);

            if (parts.length > 0) {
                var start = name + "/";

                for (var i = 0; i < parts.length; i++) {
                    var sub = parts[i];
                    if (sub.indexOf(start) != 0)
                        parts[i] = start + sub;
                }

                addUse(parts, handler);
            }
            else
                handler();

            function handler() {
                info.ready = true;

                if (info.isRoot) {
                    delete module.class_;
                    delete module.interface_;
                    delete module.enum_;
                }

                var callbacks = info.callbacks;
                if (callbacks.length > 0) {
                    for (var i = 0; i < callbacks.length; i++)
                        callbacks[i]();
                    callbacks.length = 0;
                }
            }
        };

        this.getModule = function (name) {
            var info = infos(name);
            if (info && info.isRoot && info.ready)
                return info.module;
            else
                return undefined;
        };

        var createClass = _(String, Function, function (name, ClassBody) {
            return this[name] = class_(name, ClassBody);
        });

        var createInterface = _(String, PlainObject, function (name, body) {
            return this[name] = interface_(name, body);
        });

        var createEnum = _(String, List(String), function (name, items) {
            return this[name] = enum_(name, items);
        });

        function getInfo(name) {
            var baseName = name.match(/^[^\/]+/)[0];

            var info = infos(name);

            var isRoot = baseName == name;

            if (!info) {
                info = {
                    module: isRoot ? {
                        class_: createClass,
                        interface_: createInterface,
                        enum_: createEnum
                    } : getInfo(baseName).module,
                    isRoot: isRoot,
                    ready: false,
                    created: false,
                    callbacks: []
                };
                infos(name, info);
            }

            return info;
        }
    }();

    global.module_ = _(String, Function, function (name, builder) {
        moduleInvoker.addModule(name, [], builder);
    });

    global.module_._(String, List(String), opt_(nul_(Function)), function (name, parts, builder) {
        moduleInvoker.addModule(name, parts, builder);
    });

    global.use_ = _(params_(String), Function, function (names, handler) {
        moduleInvoker.addUse(names, handler);
    });

    global.import_ = function (name) {
        var module = moduleInvoker.getModule(name);
        if (module)
            return module;
        else
            return undefined;
    };

    var requiredFiles = {};

    global.require_ = _(params_(String), require_);
    global.require_._(String, List(String), function (baseDir, srcs) {
        for (var i = 0; i < srcs.length; i++)
            srcs[i] = baseDir + srcs[i];
        return require_(srcs);
    });

    function require_(srcs) {
        var head = document.getElementsByTagName("head")[0];
        for (var i = 0; i < srcs.length; i++) {
            var src = srcs[i];
            if (hasOwnProperty.call(requiredFiles, src))
                return;

            requiredFiles[src] = true;
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.async = "async";
            script.src = src;
            head.insertBefore(script, head.firstChild);
        }
    }
}();
