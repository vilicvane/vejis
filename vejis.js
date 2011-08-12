/*
    VEJIS 0.3
    by VILIC VANE

    NOT FOR RELEASE
*/

(function () {
	//for debugging
	var _path = this.location.toString();
	var _dir = _path.replace(/[^\/]+([\?#].*)?$/, '');
	var _stackSkip = 0;

	this.is_ = function (obj, Type) {
		if (typeof Type != 'function')
			error('Parameter "Type" must be a function.');
		switch (typeof obj) {
			case 'object':
			case 'function':
			case 'undefined':
				return obj instanceof Type;
			default:
				return new obj.constructor() instanceof Type;
		}
	};

	this.foreach_ = function (arr, loop) {
		if (typeof loop != 'function')
			error('The "loop" must be a function.');
		for (var i = 0; i < arr.length; i++)
			if (loop(arr[i], i) === false)
				break;
	};

	this.each_ = function (obj, loop) {
		if (typeof loop != 'function')
			error('The "loop" must be a function.');

		for (var i in obj)
			if (obj.hasOwnProperty(i))
				if (loop(obj[i], i) === false)
					break;
	};

	this.enum_ = function () {
		var items = arguments;
		var re = /[a-z_\$][a-z0-9_\$]*/i;

		for (var i = 0; i < items.length; i++)
			if (typeof items[i] != 'string' || !re.test(items[i]))
				error('The name of possible values of for enum must be string.');

		for (var i = 0; i < items.length; i++)
			Enum[items[i]] = new Enum(items[i]);

		return Enum;
		function Enum(name) {
			this.toString = function () { return name; };
		}
	};

	/*
	Namespace
	*/

	(function () {
		var global = this;

		var nsinfos = createMap(); //namespace infos
		var useinfos = createMap();
		var sinfos = createMap(); //script infos
		var dirs = createMap();

		Namespace.call(global);

		function namespace_(name, body) {
			var that = this;
			var dir = arguments[2];

			name = getNSName(this, name);

			var index = name.lastIndexOf('.');
			var parent = name.substring(0, index);
			var child = name.substring(index + 1);

			if (parent)
				global.use_(parent, main);
			else main();

			function main() {

				var nsinfo = nsinfos(name);
				if (nsinfo) {
					if (nsinfo.status == 1)
						error('The namespace has already been created.', 1);
				}
				else
					nsinfo = nsinfos(name, buildNSInfo(name, 1));

				dirs(name, dir || (that == global ? _dir : dirs(that.toString())));

				var callQueue = false;
				if (nsinfo.status == 0) {
					callQueue = true;
					nsinfo.status = 1;
				}

				var ns = nsinfo.ns;

				try {
					var pns = parent ? global.eval(parent) : global;
					pns[child] = ns;
				}
				catch (e) { }

				Namespace.call(ns);
				body.call(ns);

				if (callQueue) {
					var queue = nsinfo.queue;
					for (var i = 0; i < queue.length; i++)
						queue[i]();
					queue.length = 0;
				}
			}

			return name;
		}

		function use_(namespace_args, body) {
			var that = this;

			var nss = [];
			var i;
			for (i = 0; i < arguments.length - 1; i++)
				if (typeof arguments[i] == 'string')
					nss.push(getNSName(this, arguments[i]));
				else
					error('The "namespace_args" need to be strings.');

			if (typeof arguments[i] != 'function')
				error('The "body" needs to be a function.');
			else
				body = arguments[i];

			var queueLen = 0;
			var nsObjs = [];

			for (var i = 0; i < nss.length; i++) (function (i) {
				var ns = nss[i];
				var nsinfo = nsinfos(ns);

				if (!nsinfo)
					nsinfo = nsinfos(ns, buildNSInfo(ns, 0));

				nsObjs[i] = nsinfo.ns;

				if (nsinfo.status == 0) {
					queueLen++;
					nsinfo.queue.push(function () {
						if (! --queueLen)
							exec();
					});
				}

			})(i);

			if (queueLen == 0)
				exec();

			function exec() {
				body.apply(that, nsObjs);
			}

		}

		function require_(url_args, opt_body) {
			var that = this;
			var dir = isGlobal(this) ? _dir : dirs(this.toString());

			var urls = [];
			var body;

			var i;
			for (i = 0; i < arguments.length - 1; i++)
				if (typeof arguments[i] == 'string')
					urls.push(arguments[i]);
				else error('The "url_args" need to be strings.');

			switch (typeof arguments[i]) {
				case 'string':
					urls.push(arguments[i]);
					break;
				case 'function':
					body = arguments[i];
					break;
				default:
					error('The "body" needs to be a function.');
			}

			var queueLen = 0;
			var nsObjs = [];

			for (var i = 0; i < urls.length; i++) (function (i) {
				var url = getURL(urls[i], dir);
				var sinfo = sinfos(url);

				if (!sinfo) {
					sinfo = sinfos(url, { ns: null, status: 0, queue: [] });
					request(url, function (script) {
						var name = global.eval(
                            '0, function (namespace_) { return false || ' + script + ' }'
                        )(function (name, body) {
                        	return namespace_.call(global, name, body, getDir(url));
                        });

						global.use_(name, function (ns) {
							sinfo.ns = ns;
							var queue = sinfo.queue;
							for (var j = 0; j < queue.length; j++)
								queue[j](i, ns);
							queue.length = 0;
						});
					});
				}

				if (sinfo.status == 0) {
					queueLen++;
					sinfo.queue.push(function (i, ns) {
						nsObjs[i] = ns;
						if (! --queueLen)
							exec();
					});
				}
				else nsObjs[i] = sinfo.ns;

			})(i);

			if (queueLen == 0)
				exec();

			function exec() {
				if (body) body.apply(that, nsObjs);
			}
		}

		function request(url, callback) {
			var xhr = global.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('MSXML2.XMLHTTP');

			xhr.open('GET', url);
			xhr.setRequestHeader('If-Modified-Since', '0');
			xhr.send(null);

			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 304))
					callback(xhr.responseText);
			};
		}

		function Namespace() {
			this.namespace_ = namespace_;
			this.require_ = require_;
			this.use_ = use_;
		}

		function buildNSInfo(name, status) {
			return {
				ns: { toString: function () { return name; } },
				status: status, //0: uninited, 1: normal
				queue: []
			};
		}

		function getNSName(that, name) {
			var re = /^\.?[a-z_\$][a-z0-9_\$]*(\.[a-z_\$][a-z0-9_\$]*)*$/;
			if (!re.test(name))
				error('Invalid namespace name.', 1);

			if (name.indexOf('.') == 0)
				name = name.substr(1);
			else if (!isGlobal(that))
				name = that + '.' + name;
			return name;
		}

		function getURL(url, base) {
			if (/^\w+:\/\//.test(url))
				return url;
			else if (url.charAt(0) == '/')
				return _dir + url.substr(1);
			else
				return base + url;
		}

		function getDir(path) {
			return path.replace(/[^\/]+([\?#].*)?$/, '');
		}

		function isGlobal(object) {
			return object == global || object.window == global; //for IE6
		}

		function createMap() {
			var map = {};

			function fn(key, value) {
				if (arguments.length == 1)
					return map['#' + key];
				else if (arguments.length == 2)
					return map['#' + key] = value;
			}

			return fn;
		}
	})();

	/*
	Class
	*/

	(function () {

		//class part
		(function () {
			var infos = createMap();

			this.class_ = function (ClassBody) {
				var alias;
				var B, sB, CB; //base class, static body, class body
				CB = ClassBody;

				var info = {};

				var pri = {};
				info.pri = pri;
				info.CB = CB;

				var first = true;

				var C = function () {
					if (first) {
						first = false;
						delete C.static_;
						delete C.inherit_;
						delete C.alias_;
					}

					var CBs = [];
					var bInfo = info.bInfo;

					if (bInfo)
						do
							CBs.unshift(bInfo.CB);
						while (bInfo = bInfo.bInfo);

					for (var i = 0; i < CBs.length; i++) {
						this._ = function () { delete this._; };
						CBs[i].call(this, C, pri);
					}

					var cst;
					this._ = function (constructor) {
						if (typeof constructor != 'function')
							error('The "constructor" must be a function.');
						delete this._;
						cst = constructor;
					};

					CB.call(this, C, pri);
					delete this._;

					if (cst)
						cst.apply(this, arguments);
				};

				infos(C, info);

				C.toString = function () {
					return (alias ? '[' + alias + ']\n' : '') + CB;
				};

				C.static_ = function (staticBody) {
					if (typeof staticBody != 'function')
						error('The "staticBody" must be a function.');

					delete C.static_;
					info.sB = sB = staticBody;

					buildStatic(C, pri, sB, true);

					return C;
				};

				C.inherit_ = function (Base) {
					if (typeof Base != 'function')
						error('The "Base" must be a function.');
					delete C.inherit_;
					info.B = B = Base;
					C.prototype = B.prototype;

					var bInfo = infos(B);

					if (bInfo) {
						info.bInfo = bInfo;
						do
							buildStatic(C, pri, bInfo.sB, false);
						while (bInfo = bInfo.bInfo);
					}

					return C;
				};

				C.alias_ = function (name) {
					delete C.alias_;
					info.alias = alias = name;
					return C;
				};

				return C;
			};

			this.static_class_ = function () {
				return class_(function () { }).static_.apply(this, arguments);
			};

			function buildStatic(pub, pri, staticBody, overwrite) {
				if (typeof staticBody == 'function') {
					var o = {
						private_: function (priBody) {
							if (typeof priBody != 'object')
								error('The "priBody" must be an object.');
							delete o.private_;
							copy(priBody, pri, overwrite);
						},
						public_: function (pubBody) {
							if (typeof pubBody != 'object')
								error('The "pubBody" must be an object.');
							delete o.public_;
							copy(pubBody, pub, overwrite);
						}
					};

					staticBody.call(o);
				}
				else copy(priBody, pri, overwrite);
			}
		})();

		function copy(from, to, overwrite) {
			if (overwrite)
				foreach_(from, function (v, i) {
					to[i] = v;
				});
			else
				foreach_(from, function (v, i) {
					if (!(i in to)) to[i] = v;
				});
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

	})();

	/*
	error
	*/
	function error(msg, skip) {
		var info = getStackInfo(skip);
		var err = new Error();
		var loc = '';

		switch (info.browser) {
			case 1:
				if (info.file && info.line)
					loc = ' in file "' + info.file + '", line ' + info.line;
				break;
			case 2:
				err.fileName = info.path;
				err.lineNumber = info.line;
				break;
			default:
				break;
		}

		err.message = 'VEJIS error' + loc + '.\n' + msg;
		throw err;
	}

	function getStackInfo(skip) {
		skip = (skip || 0) + 3 + _stackSkip;
		_stackSkip = 0;

		var err = new Error();
		var stack = err.stack;

		var browser = 0;

		if (stack) {
			var path, file, line;
			if (stack.indexOf('Error\n') == 0) {
				//Chrome
				browser = 1;
				var info = stack.split('\n    at ')[skip + 1];
				var re = /(?:^| )\(?(\S+):(\d+):\d+\)?$/;

				var parts = re.exec(info);
				if (parts) {
					path = parts[1];
					if (path.indexOf(_dir) == 0)
						file = path.substr(_dir.length);
					else file = path;
					line = parts[2];
				}

			}
			else {
				//Firefox
				browser = 2;
				var info = stack.split('\n')[skip];

				var re = /@([^\\]+):(\d+)$/;

				var parts = re.exec(info);
				if (parts) {
					path = parts[1];
					if (path.indexOf(_dir) == 0)
						file = path.substr(_dir.length);
					else file = path;
					line = parts[2];
				}
			}
		}

		return { browser: browser, error: err, path: path, file: file, line: line };
	}

})();





