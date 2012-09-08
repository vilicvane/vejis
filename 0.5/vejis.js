/*
    VEJIS JavaScript Framework v0.5
    http://vejis.org

    Copyright 2012, VILIC VANE
    Licensed under the MIT license.
*/

"VEJIS",
function () {

    /* COMMON VARIABLES */

    var global = function () { return this; }();
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var splice = Array.prototype.splice;
    var slice = Array.prototype.slice;
    var push = Array.prototype.push;

    /* COMMON METHODS */
    
    function error(description) {
        throw new Error(description);
    }

    function log() {

    }

    function warn() {

    }

    function is_(object, Type) {
        /// <summary>Determine whether an object is or can be regarded as an instance of the given type.</summary>
        /// <param name="object" type="Object">The object to be determined.</param>
        /// <param name="Type" type="Function">The type expected.</param>

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
            typeof Type == "object" && Type && !!Type.__isInstance__
        );
    }

    function isTypeMark(TypeMark) {
        return (
            typeof TypeMark == "object" &&
            TypeMark && typeof TypeMark.type == "number"
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
                    defaultValue = null;
                    break;
            }
        }
        else if (arguments.length > 1 && !is_(defaultValue, Type)) {
            error('arguments "defaultValue" and "Type" given doesn\'t match.');
            return;
        }

        return {
            type: ParamType.option,
            RelatedType: Type,
            defaultValue: defaultValue
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
            RelatedType: Type
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
            __isInstance__: function (object) {
                return object == null || is_(object, Type); // returns true when object is undefined.
            }
        };
    }

    function delegate_(params_Type) {
        var Types = slice.call(arguments)
        for (var i = 0; i < Types.length; i++) {
            if (!isTypeMark(Types[i]) && !isType(Types[i])) {
                error("invalid type.");
                return;
            }
        }

        var delegate = {
            type: ParamType.delegate,
            RelatedTypes: Types,
            __isInstance__: function (object) {
                return typeof object == "function";
            },
            with_: function (Type) {
                if (!isType(Type)) {
                    error('argument "Type" given is invalid.');
                    return;
                }
                delegate.RelatedThisType = Type;
                delete delegate.with_;
                return delegate;
            },
            as_: function (Type) {
                if (!isType(Type)) {
                    error('argument "Type" given is invalid.');
                    return;
                }
                delegate.RelatedReturnType = Type;
                delete delegate.as_;
                return delegate;
            }
        };

        return delegate;
    }

    "METHOD OVERLOADING MAIN",
    function () {
        function _(params_Type, fn) {
            var collection = new OverloadCollection();

            var method = function () {
                return collection.exec(this, arguments);
            };

            method._ = function (params_Type, fn) {
                if (arguments.length == 0)
                    return error("at least one argument is required.");

                var Types = [];
                var typesLength = arguments.length - 1;
                for (var i = 0; i < typesLength; i++) {
                    var Type = arguments[i];
                    if (!isTypeMark(Type) && !isType(Type)) {
                        error("invalid parameter type.");
                        return;
                    }
                    Types.push(Type);
                }

                fn = arguments[typesLength];

                if (typeof fn != "function") {
                    error('"fn" must be a function');
                    return;
                }

                var overload = new Overload(Types, fn);

                collection.add(overload);

                method.as_ = function (Type) {
                    if (!isType(Type)) {
                        error('argument "Type" given is invalid.');
                        return;
                    }
                    overload.ReturnType = Type;
                    delete method.as_;
                    return method;
                };

                method.with_ = function (Type) {
                    if (!isType(Type)) {
                        error('argument "Type" given is invalid.');
                        return;
                    }
                    overload.ThisType = Type;
                    delete method.with_;
                    return method;
                };

                return method;
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
            this.ThisType = undefined;
            this.ReturnType = undefined;

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
                        Type ? Type.type : undefined;
                
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

            this.exec = function (thisArg, args) {
                var result = {
                    match: false,
                    value: undefined
                };

                if (this.ThisType && !is_(thisArg, this.ThisType))
                    return result;

                var diff = args.length - required.length;

                if (
                    diff < 0 ||
                    (!ParamsRelatedType && diff > optional.length)
                ) return result;

                var destArgs = [];

                // the first part of required.
                for (var i = 0; i < optionalIndex; i++) {
                    var arg = args[i];
                    var Type = required[i];

                    if (!is_(arg, Type))
                        return result;

                    if (Type.type == ParamType.delegate) {
                        arg = _.apply(this, Type.RelatedTypes.concat(arg));
                        if (Type.RelatedThisType)
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
                        if (Type.RelatedThisType)
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
                            if (Type.RelatedThisType)
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
                        if (Type.RelatedThisType)
                            arg.with_(Type.RelatedThisType);
                        if (Type.RelatedReturnType)
                            arg.as_(Type.RelatedReturnType);
                    }

                    destArgs.push(arg);
                }

                var value = fn.apply(thisArg, destArgs);

                if (this.ReturnType && !is_(value, this.ReturnType)) {
                    error("the function returned a value doesn't match the type specified.");
                    return;
                }

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
                error("no overload matches arguments given.");
            };
        }

    }();

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
            }
        };
    }

    function Type() { }
    Type.__isInstance__ = function (object) {
        return isType(object);
    };

    function Integer() { return new Number(0); }
    Integer.__isInstance__ = function (object) {
        return typeof object == "number" && object % 1 == 0;
    };

    global.is_ = _(nul_(Object), Type, is_).as_(Boolean);
    global.PlainObject = PlainObject;
    global.IList = IList;
    global.TypedList = _(Type, TypedList);
    global.Type = Type;
    global.Integer = Integer;

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

    global.for_ = _(IList, Function, for_).as_(Boolean);
    global.forin_ = _(Object, Function, forin_).as_(Boolean);
    global.enum_ = _(params_(String), function (items) {
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

        for (var i = 0; i < count; i++)
            var ele = Enum[items[i]] = new Enum(items[i], 1 << i);

        return Enum;
    });

    /* VEJIS CLASS ENHANCING */

    var class_ = _(opt_(String), Function, function (name, ClassBody) {



    });

}();
