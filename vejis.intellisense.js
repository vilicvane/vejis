/*
    VEJIS JavaScript Framework - Intellisense File v0.5.0.10
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

    "Override setTimeout",
    function () {
        var on = false;
        var handlers = [];
        var setTimeout = global.setTimeout;

        global.setInterval =
        global.setTimeout = function (handler, timeout, args) {
            /// <param name="handler" type="Object"></param>
            /// <param name="timeout" type="Object" optional="true"></param>
            /// <param name="args" type="Object"></param>
            /// <returns type="Number" />
            addTimeout(function () {
                handler.apply(null, args);
            });
            return 0;
        };

        function addTimeout(handler) {
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
        }
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
                if (object) {
                    var constructor = object.constructor;
                    while (constructor) {
                        if (constructor == Type || constructor.prototype instanceof Type)
                            return true;
                        if (
                            constructor.__classInfo__ &&
                            constructor.__classInfo__.inheritInfo
                        )
                            constructor = constructor.__classInfo__.inheritInfo.Class;
                        else
                            constructor = null;
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
            __type__: ParamType.option,
            RelatedType: Type,
            defaultValue: defaultValue,
            __getDemoInstance__: function () {
                return getInstance(Type);
            },
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
            __type__: ParamType.params,
            RelatedType: Type,
            __getDemoInstance__: function () {
                return List(Type).__getDemoInstance__();
            },
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

        var name = getTypeName(Type) + "?";

        var type = {
            __type__: ParamType.normal,
            __nullable__: true,
            __isInstance__: function (object) {
                return object === null || is_(object, Type); // returns true when object is undefined.
            },
            __getDemoInstance__: function () {
                var ins = getInstance(Type);
                ins.constructor = constructor;
                return ins;
            },
            __name__: name
        };

        function constructor() {
            return getInstance(type);
        }

        constructor.__name__ = name;

        return type;
    }

    function Delegate() { }

    function delegate_(name, Types, body) {
        /// <summary>Create a delegate.</summary>
        /// <param name="name" type="String" optional="true">name of the delegate.</param>
        /// <param name="Types" type="Type..." optional="true">parameter types.</param>
        /// <param name="body" type="Function?">a template function.</param>

        var dName = "";

        var i = 0;
        if (is_(arguments[i], String)) {
            dName = arguments[i];
            i++;
        }

        var ParamTypes;
        var fn;

        if (is_(arguments[i], Array))
            ParamTypes = arguments[i++];
        else {
            var typesEnd = arguments.length - 1;
            ParamTypes = [];
            for (i; i < typesEnd; i++)
                ParamTypes.push(arguments[i]);
        }

        if (arguments.length <= i) {
            error('"fn" is missing.');
            return;
        }

        fn = arguments[i];

        var typeNames = [];
        for (i = 0; i < ParamTypes.length; i++) {
            var Type = ParamTypes[i];
            if (!isTypeMark(Type) && !isType(Type)) {
                error("invalid parameter type.");
                return;
            }
            typeNames.push(getTypeName(Type));
        }

        if (fn == null)
            fn = function () { };

        if (typeof fn != "function") {
            error('"fn" should be null or a function.');
            return;
        }

        var names = fn.toString().match(/\((.*?)\)/)[1].match(/[^,\s]+/g) || [];
        for (i = 0; i < typeNames.length; i++)
            typeNames[i] += " " + (names[i] || "p" + (i + 1));

        var delegate = {
            constructor: Delegate,
            __type__: ParamType.delegate,
            __RelatedTypes__: ParamTypes,
            __getDemoInstance__: function () {
                return wrapDelegate(fn, delegate);
            },
            __isInstance__: function (object) {
                return typeof object == "function";
            },
            __name__: (dName || "delegate") + "(" + typeNames.join(", ") + ")",
            with_: function (Type) {
                /// <summary>Set the type of this for this delegate.</summary>
                /// <param name="Type" type="Type">type of this.</param>
                if (!isType(Type)) {
                    error('argument "Type" given is invalid.');
                    return;
                }
                delegate.__RelatedThisType__ = Type;
                delete delegate.with_;
                delete delegate.bind_;
                return delegate;
            },
            bind_: function (object) {
                /// <summary>Bind the value of this for this delegate.</summary>
                /// <param name="object" type="Object">value of this.</param>
                if (!is_(object, Object)) {
                    error();
                    return;
                }
                delegate.__relatedThisObject__ = { value: object };
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
                delegate.__RelatedReturnType__ = Type;
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

            intellisense.redirectDefinition(method, fn);

            var params =
            fn.__params__ = [];
            fn.__return__;

            var names = fn.toString().match(/\((.*?)\)/)[1].match(/[^,\s]+/g) || [];

            for (var i = 0; i < ParamTypes.length; i++) {
                var Type = ParamTypes[i];
                var param = {
                    name: names[i] || "p" + (i + 1),
                    type: undefined,
                    optional: false 
                };

                if (Type.__type__ == ParamType.option || Type.__type__ == ParamType.params)
                    param.optional = true;

                param.type = getTypeName(Type);

                if (Type.__type__ == ParamType.params)
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
                if (!is_(object, Object)) {
                    error();
                    return;
                }
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

    function wrapDelegate(fn, Delegate) {
        fn = _.apply(null, Delegate.__RelatedTypes__.concat(fn));
        if (Delegate.__relatedThisObject__)
            fn.bind_(Delegate.__relatedThisObject__.value);
        else if (Delegate.__RelatedThisType__)
            fn.with_(Delegate.__RelatedThisType__);
        if (Delegate.__RelatedReturnType__)
            fn.as_(Delegate.__RelatedReturnType__);
        return fn;
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

        "Auto invoke for intellisense",
        function () {
            fn.__beforeInvoke__ = beforeInvoke;
            setTimeout(function () {
                fn.__beforeInvoke__();
            }, 0);

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

                if (Type.__type__ == ParamType.delegate)
                    arg = wrapDelegate(arg, Type);

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

                if (Type.__type__ == ParamType.delegate)
                    arg = wrapDelegate(arg, Type);

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

                    if (Type.__type__ == ParamType.delegate)
                        arg = wrapDelegate(arg, Type);

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

                if (Type.__type__ == ParamType.delegate)
                    arg = wrapDelegate(arg, Type);

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
        buildSignatures(e.target, e.functionHelp);
    });

    intellisense.addEventListener("statementcompletionhint", function (e) {
        if (e.completionItem.name == "this")
            return;

        var value = e.completionItem.value;
        if (value == null)
            return;

        var help;
        if (typeof value == "function") {
            help = e.symbolHelp.functionHelp;
            buildSignatures(value, help);
        }
        else {
            help = e.symbolHelp;
            help.symbolDisplayType = getTypeName(value.constructor);

            if (value.__interfaceDemo__)
                help.description = "Not implemented. " + help.description;
        }
    });

    intellisense.addEventListener('statementcompletion', function (e) {
        var re = /^[^_]*_$/;
        e.items = e.items.filter(function (item) {
            return !re.test(item.name) || e.target.hasOwnProperty(item.name);
        });
    });

    function buildSignatures(fn, functionHelp) {
        var overloads;
        if (fn.__overloads__)
            overloads = fn.__overloads__;
        else if (fn.__getConstructors__)
            overloads = fn.__getConstructors__();

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
                        return "\n";
                    });
                }

                inside = inside.replace(/(?:^|\s*\n)\s*\n[\s\S]*$/, "");

                signatures.push({
                    description: (fn.__interfaceDemo__ ? "Not implemented. " : "") + inside,
                    params: params,
                    returnValue: {
                        type: overload.__return__ ? getTypeName(overload.__return__) : undefined,
                        description: returnDescription
                    }
                });
            }
            functionHelp.signatures = signatures;
        }
    }

    /* EXTENDED TYPES */

    function PlainObject() { return {}; }
    PlainObject.__isInstance__ = function (object) {
        return !!object && typeof object == "object" && object.constructor == Object;
    };

    var IList = interface_("IList", {
        length: Integer
    });

    function List(Type) {

        var name = getTypeName(Type) + "[]";

        var type = {
            __isInstance__: function (object) {
                if (!is_(object, Array)) return false;

                for (var i = 0; i < object.length; i++) {
                    var item = object[i];
                    if (!is_(item, Type))
                        return false;
                }

                return true;
            },
            __relatedType__: List,
            __getDemoInstance__: function () {
                var ins = [getInstance(Type)];
                ins.constructor = constructor;
                return ins;
            },
            __name__: name
        };

        function constructor() {
            return getInstance(type);
        }

        constructor.__name__ = name;

        return type;
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
    global.List = _(Type, List);
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

    global.for_ = _(IList, delegate_(Object, Integer, Integer, function (value, i, length) { }), function for_(array, handler) {
        //Traverse an array, returns true if the traversal is completed.
        //array: the array to be traversed.
        //handler: the handler, return false to break traversal; and return a number to specify the increasement of i.
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
    }).as_(Boolean);

    global.for_._(params_(IList), Function, function (arrays, handler) {
        //Traverse an array, returns true if the traversal is completed.
        //arrays: the arrays to be traversed.
        //handler: the handler, the full permutation of the arrays given will be passed in as arguments, return false to break traversal.

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
    }).as_(Boolean);

    global.forin_ = _(Object, delegate_(Object, String, function (value, name) { }), function (object, handler) {
        //Traverse the properties of an object, returns true if the traversal is completed.
        //object: the target object.
        //handler: the handler, return false to break traversal.
        for (var i in object)
            if (hasOwnProperty.call(object, i))
                if (handler(object[i], i) === false)
                    return false;
        return true;
    }).as_(Boolean);

    function enum_(name, eles) {
        //Create an enumeration.
        //name: name of the enumeration.
        //eles: the elements of the enumeration.

        var count = eles.length;

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

        Enum.__name__ = name;
        Enum.__getDemoInstance__ = function () {
            return new Enum("", 0);
        };

        for (var i = 0; i < count; i++)
            var ele = Enum[eles[i]] = new Enum(eles[i], 1 << i);

        return Enum;
    }

    global.enum_ = _(String, List(String), enum_);
    global.enum_._(params_(String), function (eles) {
        //Declare an enumeration.
        //eles: the elements of the enumeration.

        return enum_("", eles);
    });

    /* VEJIS CLASS ENHANCING */

    function class_(name, ClassBody) {
        //Create a class.
        //name: name of the class.
        //ClassBody: a function that builds the class.

        var pri = {};

        var info = {
            inheritInfo: undefined,
            staticBody: undefined,
            ClassBody: ClassBody,
            Class: undefined
        };

        var relatedInstance;
        var theInterface;

        var theConstructor;

        var Class = function () {
            var that = this;
            var callByTimeout = !!arguments[0];

            if (theInterface) 
                copy(theInterface.__getDemoInstance__(), this, true);

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

            this._ = function (Types, fn) {
                /// <summary>Define a constructor.</summary>
                /// <param name="Types" type="Type..." optional="true" >parameter types.</param>
                /// <param name="fn" type="Function">the related function.</param>

                if (!constructor)
                    constructor = _.apply(this, arguments).bind_(this);
                else
                    constructor._.apply(this, arguments).bind_(this);
            };

            var ins = ClassBody.call(this, Class, pri);

            delete this._;

            if (!theConstructor) {
                if (constructor)
                    theConstructor = constructor;
                else
                    theConstructor = _.call(null, ClassBody);
            }

            if (!constructor)
                constructor = _.call(null, function () { });
            //constructor.apply(this, arguments);

            var o = this;

            if (ins) {
                var type = typeof ins;
                if (type == "function" || type == "object") {
                    copy(this, ins, false);
                    ins.constructor = Class;
                    o = ins;
                }
            }

            //if (theInterface && !is_(ins || this, theInterface)) {
            //    error("some of the items defined in the interface are not implemented.");
            //    return;
            //}

            if (theInterface)
                interfaceFormat(o, theInterface, callByTimeout);

            return ins;
        };

        Class.__name__ = name;
        Class.__classInfo__ = info;
        Class.__getConstructors__ = function () {
            new Class();
            return theConstructor.__overloads__;
        };

        Class.static_ = _(PlainObject, function (body) {
            //Define a private static object.
            //body: a plain object.

            delete Class.static_;
            info.staticBody = body;

            copy(body, pri, true);

            return Class;
        });

        Class.static_._(Function, function (body) {
            //Define static objects.
            //body: a function contains "this.private_" or "this.public_" method(s) that defines private or public static object.

            delete Class.static_;
            info.staticBody = body;

            buildStatic(Class, pri, body, true);

            return Class;
        });

        Class.inherit_ = function (BaseClass) {
            /// <summary>Inherit from a class.</summary>
            /// <param name="BaseClass" type="Type">the base class, can be either a classic class or a VEJIS class.</param>

            delete Class.inherit_;

            new BaseClass();

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
        };

        Class.implement_ = function (Interface) {
            /// <summary>Implement an interface.</summary>
            /// <param name="Interface" type="Interface">the interface to be implemented.</param>

            delete Class.inherit_;
            delete Class.implement_;
            theInterface = Interface;

            return Class;
        };

        info.Class = Class;

        setTimeout(function () {
            new Class(true);
        }, 0);

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

    function interfaceFormat(ins, theInterface, callByTimeout) {
        var list = theInterface.__list__;
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var name = item.name;
            var Type = item.Type;
            var p = ins[name];
            if (Type.__type__ == ParamType.delegate) {
                if (typeof p != "function")
                    p = function () { };
                ins[name] = wrapDelegate(p, Type);
            }
            else if (is_(Type, Interface)) {
                if (typeof p != "object" && typeof p != "function" || p == null)
                    ins[name] = p = {};
                interfaceFormat(p, Type, callByTimeout);
            }
            else if (!is_(p, Type)) {
                ins[name] = getInstance(Type);
            }

            if (!callByTimeout)
                delete ins[name].__interfaceDemo__;
        }
    }

    global.class_ = _(opt_(String), Function, class_);

    function interface_(name, body) {
        //Create an interface.
        //name: name of the interface.
        //body: an object describes the interface.

        var list = [];
        var hash = {};

        for (var i in body) {
            if (hasOwnProperty.call(body, i)) {
                var Type = body[i];
                ins[i] = getInstance(Type);
                ins[i].__interfaceDemo__ = true;
                list.push({
                    name: i,
                    Type: Type
                });
                hash[i] = true;
            }
        }

        var theInterface = new Interface();

        theInterface.__getDemoInstance__ = function () {
            var ins = {};
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                ins[item.name] = getInstance(item.Type);
                ins[item.name].__interfaceDemo__ = true;
            }
            ins.constructor = theInterface;
            return ins;
        };

        theInterface.__isInstance__ = function (object) {
            if (!object) return false;

            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                if (!is_(object[item.name], item.Type))
                    return false;
            }

            return true;
        };
        theInterface.__name__ = name;
        theInterface.__list__ = list;
        theInterface.inherit_ = function (target) {
            /// <param name="target" type="Interface">the interface to inherit.</param>
            if (!is_(target, Interface)) {
                error("parameter target should be Interface.");
                return;
            }

            var pList = target.__list__ || [];
            for (var i = 0; i < pList.length; i++) {
                var item = pList[i];
                if (!hasOwnProperty.call(hash, item.name)) {
                    list.push(item);
                    ins[item.name] = getInstance(item.Type);
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

    function getInstance(Type) {
        var ins;
        if (hasOwnProperty.call(Type, "__getDemoInstance__"))
            ins = Type.__getDemoInstance__();
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

    function Module() { }

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

            //the order of the code below is reversed comparing with vejis.js
            //start
            if (builder)
                builder.call(module);

            if (info.created) {
                warn('module "' + name + '" already exists.');
                return;
            }

            info.created = true;
            //end

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
                    delete module.delegate_;
                    delete module.enum_;
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

        this.getModule = function (name) {
            var info = infos(name);
            if (info && info.isRoot && info.ready)
                return info.module;
            else
                return undefined;
        };

        var createDelegate = function (name, Types, body) {
            /// <summary>Create a delegate.</summary>
            /// <param name="name" type="String">name of the delegate.</param>
            /// <param name="Types" type="Type..." optional="true">parameter types.</param>
            /// <param name="body" type="Function?">a template function.</param>

            if (!is_(name, String) || name.length == 0) {
                error('"name" must be a non-empty string.');
                return;
            }

            return this[name] = delegate_.apply(this, arguments);
        };

        var createEnum = _(String, List(String), function (name, eles) {
            //Create an enumeration.
            //name: name of the enumeration.
            //eles: the elements of the enumeration.
            
            return this[name] = enum_(name, eles);
        });

        var createClass = _(String, Function, function (name, ClassBody) {
            //Create a class.
            //name: name of the class.
            //ClassBody: a function that builds the class.
            
            return this[name] = class_(name, ClassBody);
        });

        var createInterface = _(String, PlainObject, function (name, body) {
            //Create an interface.
            //name: name of the interface.
            //body: an object describes the interface.

            return this[name] = interface_(name, body);
        });

        function getInfo(name) {
            var baseName = name.match(/^[^\/]+/)[0];

            var info = infos(name);

            var isRoot = baseName == name;

            if (!info) {
                info = {
                    module: isRoot ? {
                        constructor: Module,
                        delegate_: createDelegate,
                        enum_: createEnum,
                        class_: createClass,
                        interface_: createInterface
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
        //Create a module.
        //name: name of the module.
        //builder: a function to build the module using "this" pointer.
        moduleInvoker.addModule(name, [], builder);
    });

    global.module_._(String, List(String), opt_(nul_(Function)), function (name, parts, builder) {
        //Create a module with parts separated.
        //name: name of the module.
        //parts: names of its parts.
        //builder: a function to build the module using "this" pointer.
        moduleInvoker.addModule(name, parts, builder);
    });

    global.use_ = _(params_(String), Function, function (names, handler) {
        //Use some modules.
        //names: names of modules that need to use.
        //handler: handler to be called when modules specified are ready. the module objects will be passed as arguments in order.
        moduleInvoker.addUse(names, handler);
    });

    global.import_ = _(String, function (name) {
        //Returns a module object by the name given.
        //name: name of the module.

        var module = moduleInvoker.getModule(name);
        if (module)
            return module;
        else {
            warn('module "' + name + '" has not been loaded.');
            return undefined;
        }
    });

    var requiredFiles = {};

    global.require_ = _(params_(String), require_);
    global.require_._(String, List(String), function (baseDir, srcs) {
        //Require script files by adding script tags.
        //baseDir: specify a base directory that will be added to the srcs strings.
        //srcs: the srcs.
        for (var i = 0; i < srcs.length; i++)
            srcs[i] = baseDir + srcs[i];
        return require_(srcs);
    });

    function require_(srcs) {
        //Require script files by adding script tags.
        //srcs: the srcs.

        var length = srcs.length;
        for (var i = 0; i < length; i++) {
            var src = srcs[i];

            if (!src.length) {
                srcs.splice(i--, 1);
                length--;
                continue;
            }

            var index = src.indexOf("/");
            if (index == 0) {
                src = src.substr(1);
                srcs.push(src);
            }

            for (var i = 0; i < 5; i++) {
                src = "../" + src;
                srcs.push(src);
            }
        }

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
