/*
    VEJIS Intellisense file v0.5.0.121014
    http://vejis.org

    This version is still preliminary and subject to change.
    
    Copyright 2012, VILIC VANE
    Licensed under the MIT license.
*/

"VEJIS",
function () {

    /* COMMON VARIABLES */

    var global = function () { return this; }();
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var slice = Array.prototype.slice;

    var zeroTimer = new function () {
        var on = false;
        var handlers = [];
        this.add = function (handler) {
            handlers.push(handler);
            if (!on) {
                on = true;
                setTimeout(function () {
                    on = false;
                    for (var i = 0; i < handlers.length; i++)
                        handlers[i]();
                    handlers.length = 0;
                }, 0);
            }
        };
    }();

    /* COMMON METHODS */
    
    function error(description) {
        throw new Error(description);
    }

    function log(msg) {
        if (global.console)
            console.log(msg);
    }

    function warn(msg) {
        if (global.console)
            console.warn(msg);
    }

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
            case "undefined":
                return object instanceof Type;
            default:
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
            !!TypeMark && typeof TypeMark.type == "number"
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
        if (!arguments.length) {
            error("no argument given.");
            return;
        }

        if (!isType(Type)) {
            error('argument "Type" given is invalid.');
            return;
        }

        if (arguments.length == 1) {
            switch (Type) {
                case Number:
                    defaultValue = 0;
                    break;
                case String:
                    defaultValue = "";
                    break;
                case Boolean:
                    defaultValue = false;
                    break;
                default:
                    if (Type.nullable)
                        defaultValue = null;
                    else {
                        error('argument "defaultValue" is required when the "Type" given is not String, Number, Boolean or a nullable type.');
                        return;
                    }
                    break;
            }
        }
        //else if (arguments.length > 1 && !is_(defaultValue, Type)) {
        //    error('arguments "defaultValue" and "Type" given doesn\'t match.');
        //    return;
        //}

        return {
            type: ParamType.option,
            RelatedType: Type,
            defaultValue: defaultValue,
            __demoInstance__: getInstance(Type),
            __name__: getTypeName(Type)
        };
    }

    function params_(Type) {
        if (!arguments.length) {
            error("no argument given.");
            return;
        }

        if (!isType(Type)) {
            error('argument "Type" given is invalid.');
            return;
        }

        return {
            type: ParamType.params,
            RelatedType: Type,
            __demoInstance__: [getInstance(Type)],
            __name__: getTypeName(Type)
        };
    }

    function nul_(Type) {
        if (!arguments.length) {
            error("no argument given.");
            return;
        }

        if (!isType(Type)) {
            error('argument "Type" given is invalid.');
            return;
        }

        return {
            type: ParamType.normal,
            nullable: true,
            __isInstance__: function (object) {
                return object == null || is_(object, Type); // returns true when object is undefined.
            },
            __demoInstance__: getInstance(Type),
            __name__: getTypeName(Type) + "?"
        };
    }

    function delegate_(params_Type, body) {
        if (arguments.length == 0) {
            error("at least one argument is required.");
            return;
        }

        var typeNames = [];

        var Types = [];
        var typesLength = arguments.length - 1;

        for (var i = 0; i < typesLength; i++) {
            var Type = arguments[i];

            if (!isTypeMark(Type) && !isType(Type)) {
                error("invalid parameter type.");
                return;
            }

            Types.push(Type);
            typeNames.push(getTypeName(Type));
        }

        body = arguments[typesLength];
        if (body == null)
            body = function () { };

        if (typeof body != "function") {
            error('"body" should be null or a function.');
            return;
        }

        var names = body.toString().match(/\((.*)\)/)[1].match(/[^,\s]+/g) || [];
        for (var i = 0; i < typeNames.length; i++)
            typeNames[i] += " " + (names[i] || "p" + (i + 1));

        var args = Types.concat(body);
        var demoIns = _.apply(null, args);

        var delegate = {
            type: ParamType.delegate,
            RelatedTypes: Types,
            __demoInstance__: demoIns,
            __isInstance__: function (object) {
                return typeof object == "function";
            },
            __name__: "delegate(" + typeNames.join(", ") + ")",
            with_: function (Type) {
                /// <summary>Set the type of this for this delegate.</summary>
                /// <param name="Type" type="Type">type of this.</param>
                if (!isType(Type)) {
                    error('argument "Type" given is invalid.');
                    return;
                }
                delegate.RelatedThisType = Type;
                delete delegate.with_;
                delete delegate.bind_;
                return delegate;
            },
            bind_: function (object) {
                /// <summary>Bind the value of this for this delegate.</summary>
                /// <param name="object" type="Object">value of this.</param>
                delegate.relatedThisObject = { value: object };
                delete delegate.with_;
                delete delegate.bind_;
                return delegate;
            },
            as_: function (Type) {
                /// <summary>Set the type of return value for this delegate.</summary>
                /// <param name="Type" type="Type">type of this.</param>
                if (!isType(Type)) {
                    error('argument "Type" given is invalid.');
                    return;
                }
                delegate.RelatedReturnType = Type;
                demoIns.as_(Type);
                delegate.__name__ = getTypeName(Type) + " " + delegate.__name__;
                delete delegate.as_;
                return delegate;
            }
        };

        return delegate;
    }

    function _(Types, fn) {
        /// <summary>Create a VEJIS method.</summary>
        /// <param name="Types" type="Type..." optional="true" >parameter types.</param>
        /// <param name="fn" type="Function">the related function.</param>

        var collection = new OverloadCollection();

        var method = function () {
            return collection.exec(this, arguments);
        };

        var overloads =
        method.__overloads__ = [];

        method._ = function (Types, fn) {
            /// <summary>Create an overload.</summary>
            /// <param name="Types" type="Type..." optional="true" >parameter types.</param>
            /// <param name="fn" type="Function">the related function.</param>

            if (arguments.length == 0)
                return error("at least one argument is required.");

            var ParamTypes = [];

            var typesLength = arguments.length - 1;
            for (var i = 0; i < typesLength; i++) {
                var Type = arguments[i];
                if (!isTypeMark(Type) && !isType(Type)) {
                    error("invalid parameter type.");
                    return;
                }
                ParamTypes.push(Type);
            }

            fn = arguments[typesLength];

            if (typeof fn != "function") {
                error('"fn" must be a function');
                return;
            }

            var params =
            fn.__params__ = [];
            fn.__return__;

            var names = fn.toString().match(/\((.*)\)/)[1].match(/[^,\s]+/g) || [];

            for (var i = 0; i < ParamTypes.length; i++) {
                var Type = ParamTypes[i];
                var param = {
                    name: names[i] || "p" + (i + 1),
                    type: undefined,
                    optional: false 
                };

                if (Type.type == ParamType.option || Type.type == ParamType.params)
                    param.optional = true;

                param.type = getTypeName(Type);

                if (Type.type == ParamType.params)
                    param.type += "...";

                params.push(param);
            }
            overloads.push(fn);
        
            var overload = new Overload(ParamTypes, fn);

            collection.add(overload);

            method.as_ = function (Type) {
                /// <summary>Set the type of return value for this overload.</summary>
                /// <param name="Type" type="Type">type of this.</param>
                if (!isType(Type)) {
                    error('argument "Type" given is invalid.');
                    return;
                }
                fn.__return__ =
                overload.ReturnType = Type;
                delete method.as_;
                return method;
            };

            method.with_ = function (Type) {
                /// <summary>Set the type of this for this overload.</summary>
                /// <param name="Type" type="Type">type of this.</param>
                if (!isType(Type)) {
                    error('argument "Type" given is invalid.');
                    return;
                }
                overload.ThisType = Type;
                delete method.with_;
                delete method.bind_;
                return method;
            };

            method.bind_ = function (object) {
                /// <summary>Bind the value of this for this overload.</summary>
                /// <param name="object" type="Object">value of this.</param>
                overload.thisObject = { value: object };
                delete method.with_;
                delete method.bind_;
                return method;
            };

            method.static_ = function (staticObject) {
                /// <summary>Define the static object for this method.</summary>
                /// <param name="staticObject" type="PlainObject">the static object.</param>
                if (!is_(staticObject, PlainObject)) {
                    error('"staticObject" must be a plain object.');
                    return;
                }
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

    function getTypeName(Type, def) {
        var name;

        if (Type.__name__)
            name = Type.__name__;
        else if (typeof Type == "function")
            name = /^function\s([^\(]*)/.exec(Type.toString())[1];

        if (typeof name != "string")
            name = arguments.length == 1 ? "UnnamedType" : def;

        return name;
    }

    global._ = _;
    global.opt_ = opt_;
    global.params_ = params_;
    global.nul_ = nul_;
    global.delegate_ = delegate_;

    function Overload(Types, fn) {
        var that = this;

        this.Types = Types;
        this.thisObject = undefined;
        this.ThisType = undefined;
        this.ReturnType = undefined;
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
                    Type ? Type.type || ParamType.normal : undefined;
                
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
                    if (status > 1) {
                        error('"option" parameter position invalid.');
                        return;
                    }
                    optional.push(Type);
                    break;
                case ParamType.params:
                    if (status < 2) {
                        status = 2;
                        ParamsRelatedType = Type.RelatedType;
                    }
                    else if (status > 2) {
                        error('"params" parameter position invalid.');
                        return;
                    }
                    else {
                        error('"params" parameter can only appear once in an overload.');
                        return;
                    }
                    break;
            }
        }

        "IS PART",
        function () {
            fn.__beforeInvoke__ = beforeInvoke;
            zeroTimer.add(function () {
                fn.__beforeInvoke__();
            });

            function beforeInvoke() {
                fn.__beforeInvoke__ = function () { };

                var args = [];

                if (that.staticObject)
                    args.push(that.staticObject);

                for (var i = 0; i < Types.length; i++)
                    args.push(getInstance(Types[i]));

                fn.apply(that.thisObject ? that.thisObject.value : getInstance(that.ThisType), args);
            }
        }();

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

                if (Type.type == ParamType.delegate) {
                    arg = _.apply(this, Type.RelatedTypes.concat(arg));
                    if (Type.relatedThisObject)
                        arg.bind_(Type.relatedThisObject.value);
                    else if (Type.RelatedThisType)
                        arg.with_(Type.RelatedThisType);
                    if (Type.RelatedReturnType)
                        arg.as_(Type.RelatedReturnType);
                }

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

                if (Type.type == ParamType.delegate) {
                    arg = _.apply(this, Type.RelatedTypes.concat(arg));
                    if (Type.relatedThisObject)
                        arg.bind_(Type.relatedThisObject.value);
                    else if (Type.RelatedThisType)
                        arg.with_(Type.RelatedThisType);
                    if (Type.RelatedReturnType)
                        arg.as_(Type.RelatedReturnType);
                }

                destArgs.push(arg);
            }

            // the params part.
            var paEnd = diff + optionalIndex;
            var paLength = diff - opLength;
            var paStart = optionalIndex + opLength;

            if (paLength == 1 && is_(args[paStart], TypedList(ParamsRelatedType)))
                destArgs.push(slice.call(args[paStart]));
            else if (ParamsRelatedType) {
                var paArray = [];
                for (var i = paStart; i < paEnd; i++) {
                    var arg = args[i];
                    var Type = ParamsRelatedType;

                    if (!is_(arg, Type))
                        return result;

                    if (Type.type == ParamType.delegate) {
                        arg = _.apply(this, Type.RelatedTypes.concat(arg));
                        if (Type.relatedThisObject)
                            arg.bind_(Type.relatedThisObject.value);
                        else if (Type.RelatedThisType)
                            arg.with_(Type.RelatedThisType);
                        if (Type.RelatedReturnType)
                            arg.as_(Type.RelatedReturnType);
                    }

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

                if (Type.type == ParamType.delegate) {
                    arg = _.apply(this, Type.RelatedTypes.concat(arg));
                    if (Type.relatedThisObject)
                        arg.bind_(Type.relatedThisObject.value);
                    else if (Type.RelatedThisType)
                        arg.with_(Type.RelatedThisType);
                    if (Type.RelatedReturnType)
                        arg.as_(Type.RelatedReturnType);
                }

                destArgs.push(arg);
            }

            var value;
            try {
                fn.__beforeInvoke__();
                value = fn.apply(thisArg, destArgs);
            } catch (e) { }

            if (this.ReturnType && !is_(value, this.ReturnType))
                value = getInstance(this.ReturnType);

            result.match = true;
            result.value = value;

            return result;
        };

        this.toString = function () {
            return fn.toString();
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
            error("no overload matches arguments given.");
        };

        this.toString = function () {
            return list.join("\n-\n");
        };
    }

    intellisense.addEventListener("signaturehelp", function (e) {
        var overloads;
        if (e.target.__overloads__)
            overloads = e.target.__overloads__;
        else if (e.target.__getConstructors__) 
            overloads = e.target.__getConstructors__();

        if (overloads) {
            var signatures = [];
            for (var i = 0; i < overloads.length; i++) {
                var overload = overloads[i];
                var inside = intellisense.getFunctionComments(overload).inside;

                var params = overload.__params__;

                for (var j = 0; j < params.length; j++) {
                    var param = params[j];
                    var name = param.name;
                    var re = new RegExp("(?:^|\r?\n)\s*" + name + "\s*:\s*(.+)");

                    inside = inside.replace(re, function (m, g1) {
                        param.description = g1;
                        return "";
                    });
                }

                signatures.push({
                    description: inside,
                    params: params,
                    returnValue: {
                        type: overload.__return__ ? getTypeName(overload.__return__) : undefined,
                        description: returnDescription
                    }
                });
            }
            e.functionHelp.signatures = signatures;
        }
    });

    /* EXTENDED TYPES */

    function PlainObject() { return {}; }
    PlainObject.__isInstance__ = function (object) {
        return object && typeof object == "object" && object.constructor == Object;
    };

    function IList() { return []; }
    IList.__isInstance__ = function (object) {
        return object && typeof object == "object" && typeof object.length == "number";
    };

    function TypedList(Type) {
        return {
            __isInstance__: function (object) {
                if (!is_(object, IList)) return false;

                for (var i = 0; i < object.length; i++) {
                    var item = object[i];
                    if (!is_(item, Type))
                        return false;
                }

                return true;
            },
            __demoInstance__: [getInstance(Type)],
            __name__: getTypeName(Type) + "[]"
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
    global.TypedList = _(Type, TypedList);
    global.Type = Type;
    global.Integer = Integer;

    "add __name__",
    function () {
        for (var i in global) {
            if (typeof global[i] == "function" && /[A-Z]/.test(i.charAt(0)) && !global[i].__name__)
                global[i].__name__ = i;
        }

        var list = "Number|String|Boolean|RegExp|Array|Function|Object".split("|");
        for (var i = 0; i < list.length; i++)
            global[list[i]].__name__ = list[i];
    }();

    global.is_ = _(nul_(Object), Type, is_).as_(Boolean);

    /* OTHER EXTENDED METHODS */

    function for_(array, loop) {
        for (var i = 0; i < array.length;) {
            var result = loop(array[i], i, array.length);
            if (result === false)
                return false;
            else if (typeof result == "number")
                i += result;
            else
                i++;
        }
        return true;
    }

    function forin_(object, loop) {
        for (var i in object)
            if (hasOwnProperty.call(object, i))
                if (loop(object[i], i) === false)
                    return false;
        return true;
    }

    global.for_ = _(IList, delegate_(Object, Integer, Integer, function (object, i, length) { }), for_).as_(Boolean);
    global.forin_ = _(Object, delegate_(Object, String, function (object, i) { }), forin_).as_(Boolean);

    function enum_(items) {
        var count = items.length;

        if (count > 32) {
            error("the length of enumeration list has exceeded the limit of 32.");
            return;
        }

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

        Enum.__demoInstance__ = new Enum("", 0);

        for (var i = 0; i < count; i++)
            var ele = Enum[items[i]] = new Enum(items[i], 1 << i);

        return Enum;
    }

    global.enum_ = _(params_(String), enum_);
    global.enum_._(String, TypedList(String), function (name, items) {
        var Enum = enum_(items);
        Enum.__name__ = name;
        return Enum;
    });

    /* VEJIS CLASS ENHANCING */

    function class_(name, ClassBody) {
        var pri = {};

        var info = {
            inheritInfo: undefined,
            staticBody: undefined,
            ClassBody: ClassBody
        };

        var relatedInstance;

        var theConstructor;

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
                    if (type == "function" || type == "object") {
                        error("a base class in the inheritance chain is actually a factory and is not inheritable.");
                        return;
                    }
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

            if (constructor) {
                constructor.apply(this, arguments);
                if (!theConstructor)
                    theConstructor = constructor;
            }

            if (ins) {
                var type = typeof ins;
                if (type == "function" || type == "object") {
                    if (!relatedInstance) {
                        var RelatedClass = function () { };
                        RelatedClass.prototype = Class.prototype;
                        relatedInstance = new RelatedClass();
                    }
                    ins.__relatedInstance__ = relatedInstance;
                }
            }

            return ins;
        };

        Class.__name__ = name;
        Class.__classInfo__ = info;
        Class.__getConstructors__ = function () {
            new Class();
            return theConstructor.__overloads__;
        };

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

            new BaseClass();

            Class.prototype = BaseClass.prototype;

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
                    ClassBody: BaseClass
                };
            }
            
            return Class;
        });

        zeroTimer.add(function () {
            new Class();
        });

        return Class;
    }

    global.class_ = _(opt_(String), Function, class_);

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

    function interface_(name, body) {
        var ins = {};
        var list = [];

        for (var i in body) {
            if (hasOwnProperty.call(body, i)) {
                var Type = body[i];
                ins[i] = getInstance(Type);
                list.push({
                    name: i,
                    Type: Type
                });
            }
        }

        var Interface = {
            __demoInstance__: ins,
            __isInstance__: function (object) {
                if (!object) return false;

                for (var i = 0; i < list.length; i++) {
                    var item = list[i];
                    if (!is_(object[item.name], item.Type))
                        return false;
                }

                return true;
            }
        };

        Interface.__name__ = name;

        return Interface;
    }

    global.interface_ = _(opt_(String), PlainObject, interface_);

    function getInstance(Type) {
        var ins;
        if (hasOwnProperty.call(Type, "__demoInstance__"))
            ins = Type.__demoInstance__;
        else {
            try {
                ins = new Type();
            } catch (e) {
                ins = Type.prototype;
            }
        }
        return ins;
    }

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

        this.addModule = function (name, subs, builder) {
            var info = getInfo(name);

            var module = info.module;

            if (info.ready) {
                warn('module "' + name + '" already loaded.');
                return;
            }

            builder.call(module);

            if (subs.length > 0) {
                var start = name + "/";

                for (var i = 0; i < subs.length; i++) {
                    var sub = subs[i];
                    if (sub.indexOf(start) != 0)
                        subs[i] = start + sub;
                }

                addUse(subs, handler);
            }
            else
                handler();

            function handler() {
                info.ready = true;

                if (info.isRoot) {
                    delete module.class_;
                    delete module.interface_;
                }

                var callbacks = info.callbacks;
                if (callbacks.length > 0) {
                    for (var i = 0; i < callbacks.length; i++)
                        callbacks[i]();
                    callbacks.length = 0;
                }
            }
        };

        var createClass = _(String, Function, function (name, ClassBody) {
            return this[name] = class_(name, ClassBody);
        });

        var createInterface = _(String, PlainObject, function (name, body) {
            return this[name] = interface_(name, body);
        });

        function getInfo(name) {
            var baseName = name.match(/[^\/]+/)[0];

            var info = infos(name);

            var isRoot = baseName == name;

            if (!info) {
                info = {
                    module: isRoot ? {
                        class_: createClass,
                        interface_: createInterface
                    } : infos(baseName).module,
                    isRoot: isRoot,
                    ready: false,
                    callbacks: []
                };
                infos(name, info);
            }

            return info;
        }
    }();

    global.module_ = _(String, opt_(TypedList(String), []), Function, function (name, subs, builder) {
        moduleInvoker.addModule(name, subs, builder);
    });

    global.use_ = _(params_(String), Function, function (names, handler) {
        moduleInvoker.addUse(names, handler);
    });

    var requiredFiles = {};

    global.require_ = _(params_(String), function (files) {
        var head = document.getElementsByTagName("head")[0];
        for_(files, function (file) {
            if (hasOwnProperty.call(requiredFiles, file))
                return;

            requiredFiles[file] = true;
            var script = document.createElement("script");
            script.async = "async";
            script.src = file;
            head.insertBefore(script, head.firstChild);
        });
    });

}();
