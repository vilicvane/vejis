/*
    VEJIS 0.3
    by VILIC VANE

    NOT FOR RELEASE
*/

//VEJIS CORE
(function () {
	var global = this;

	//for debugging
	var _path = this.location.toString();
	var _dir = _path.replace(/[^\/]+([\?#].*)?$/, '');
	var _stackSkip = 0;

	var toString = Object.prototype.toString;
	var md5 = function () { function l(f, e) { var d = f[0], a = f[1], b = f[2], c = f[3], d = g(d, a, b, c, e[0], 7, -680876936), c = g(c, d, a, b, e[1], 12, -389564586), b = g(b, c, d, a, e[2], 17, 606105819), a = g(a, b, c, d, e[3], 22, -1044525330), d = g(d, a, b, c, e[4], 7, -176418897), c = g(c, d, a, b, e[5], 12, 1200080426), b = g(b, c, d, a, e[6], 17, -1473231341), a = g(a, b, c, d, e[7], 22, -45705983), d = g(d, a, b, c, e[8], 7, 1770035416), c = g(c, d, a, b, e[9], 12, -1958414417), b = g(b, c, d, a, e[10], 17, -42063), a = g(a, b, c, d, e[11], 22, -1990404162), d = g(d, a, b, c, e[12], 7, 1804603682), c = g(c, d, a, b, e[13], 12, -40341101), b = g(b, c, d, a, e[14], 17, -1502002290), a = g(a, b, c, d, e[15], 22, 1236535329), d = i(d, a, b, c, e[1], 5, -165796510), c = i(c, d, a, b, e[6], 9, -1069501632), b = i(b, c, d, a, e[11], 14, 643717713), a = i(a, b, c, d, e[0], 20, -373897302), d = i(d, a, b, c, e[5], 5, -701558691), c = i(c, d, a, b, e[10], 9, 38016083), b = i(b, c, d, a, e[15], 14, -660478335), a = i(a, b, c, d, e[4], 20, -405537848), d = i(d, a, b, c, e[9], 5, 568446438), c = i(c, d, a, b, e[14], 9, -1019803690), b = i(b, c, d, a, e[3], 14, -187363961), a = i(a, b, c, d, e[8], 20, 1163531501), d = i(d, a, b, c, e[13], 5, -1444681467), c = i(c, d, a, b, e[2], 9, -51403784), b = i(b, c, d, a, e[7], 14, 1735328473), a = i(a, b, c, d, e[12], 20, -1926607734), d = h(a ^ b ^ c, d, a, e[5], 4, -378558), c = h(d ^ a ^ b, c, d, e[8], 11, -2022574463), b = h(c ^ d ^ a, b, c, e[11], 16, 1839030562), a = h(b ^ c ^ d, a, b, e[14], 23, -35309556), d = h(a ^ b ^ c, d, a, e[1], 4, -1530992060), c = h(d ^ a ^ b, c, d, e[4], 11, 1272893353), b = h(c ^ d ^ a, b, c, e[7], 16, -155497632), a = h(b ^ c ^ d, a, b, e[10], 23, -1094730640), d = h(a ^ b ^ c, d, a, e[13], 4, 681279174), c = h(d ^ a ^ b, c, d, e[0], 11, -358537222), b = h(c ^ d ^ a, b, c, e[3], 16, -722521979), a = h(b ^ c ^ d, a, b, e[6], 23, 76029189), d = h(a ^ b ^ c, d, a, e[9], 4, -640364487), c = h(d ^ a ^ b, c, d, e[12], 11, -421815835), b = h(c ^ d ^ a, b, c, e[15], 16, 530742520), a = h(b ^ c ^ d, a, b, e[2], 23, -995338651), d = j(d, a, b, c, e[0], 6, -198630844), c = j(c, d, a, b, e[7], 10, 1126891415), b = j(b, c, d, a, e[14], 15, -1416354905), a = j(a, b, c, d, e[5], 21, -57434055), d = j(d, a, b, c, e[12], 6, 1700485571), c = j(c, d, a, b, e[3], 10, -1894986606), b = j(b, c, d, a, e[10], 15, -1051523), a = j(a, b, c, d, e[1], 21, -2054922799), d = j(d, a, b, c, e[8], 6, 1873313359), c = j(c, d, a, b, e[15], 10, -30611744), b = j(b, c, d, a, e[6], 15, -1560198380), a = j(a, b, c, d, e[13], 21, 1309151649), d = j(d, a, b, c, e[4], 6, -145523070), c = j(c, d, a, b, e[11], 10, -1120210379), b = j(b, c, d, a, e[2], 15, 718787259), a = j(a, b, c, d, e[9], 21, -343485551); f[0] = k(d, f[0]); f[1] = k(a, f[1]); f[2] = k(b, f[2]); f[3] = k(c, f[3]) } function h(f, e, d, a, b, c) { e = k(k(e, f), k(a, c)); return k(e << b | e >>> 32 - b, d) } function g(f, e, d, a, b, c, g) { return h(e & d | ~e & a, f, e, b, c, g) } function i(f, e, d, a, b, c, g) { return h(e & a | d & ~a, f, e, b, c, g) } function j(f, e, d, a, b, c, g) { return h(d ^ (e | ~a), f, e, b, c, g) } function m(f) { var e = f; txt = ""; var d = e.length, f = [1732584193, -271733879, -1732584194, 271733878], a; for (a = 64; a <= e.length; a += 64) { for (var b = f, c = e.substring(a - 64, a), g = [], h = void 0, h = 0; h < 64; h += 4) g[h >> 2] = c.charCodeAt(h) + (c.charCodeAt(h + 1) << 8) + (c.charCodeAt(h + 2) << 16) + (c.charCodeAt(h + 3) << 24); l(b, g) } e = e.substring(a - 64); b = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; for (a = 0; a < e.length; a++) b[a >> 2] |= e.charCodeAt(a) << (a % 4 << 3); b[a >> 2] |= 128 << (a % 4 << 3); if (a > 55) { l(f, b); for (a = 0; a < 16; a++) b[a] = 0 } b[14] = d * 8; l(f, b); for (e = 0; e < f.length; e++) { d = f; a = e; b = f[e]; c = ""; for (g = 0; g < 4; g++) c += n[b >> g * 8 + 4 & 15] + n[b >> g * 8 & 15]; d[a] = c } return f.join("") } function k(f, e) { return f + e & 4294967295 } var n = "0123456789abcdef".split(""); m("hello") != "5d41402abc4b2a76b9719d911017c592" && (k = function (f, e) { var d = (f & 65535) + (e & 65535); return (f >> 16) + (e >> 16) + (d >> 16) << 16 | d & 65535 }); return m } ();

	this.is_ = function (object, Type) {
		if (typeof Type != 'function')
			error('Parameter "Type" must be a function.');
		switch (typeof object) {
			case 'object':
			case 'function':
			case 'undefined':
				return object instanceof Type;
			default:
				return new object.constructor() instanceof Type;
		}
	};

	this.for_ = function (array, loop) {
		if (typeof loop != 'function')
			error('The "loop" must be a function.');
		if (!(array && array.length)) return;
		for (var i = 0; i < array.length; i++)
			if (loop(array[i], i, array.length) === false)
				return false;
		return true;
	};

	this.forin_ = function (object, loop) {
		if (typeof loop != 'function')
			error('The "loop" must be a function.');
		if (!object) return;
		for (var i in object)
			if (object.hasOwnProperty(i))
				if (loop(object[i], i) === false)
					return false;
		return true;
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
		var nsinfos = createMap(); //namespace infos
		var useinfos = createMap();
		var sinfos = createMap(); //script infos
		var shinfos = createMap(); //script hash infos
		var dirs = createMap();

		Namespace.call(global);

		function namespace_(name, body) {
			var that = this;
			var dir = arguments[2];

			if (typeof name != 'string')
				error('The "name" needs to be a string.');
			if (typeof body != 'function')
				error('The "body" needs to be a function.');

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

				var upperNames = name.match(/[^\.]*(?=\.)/);
				var upperNSs = [];
				for_(upperNames, function (name) {
					upperNSs.push(nsinfos(name).ns);
				});

				Namespace.call(ns);
				body.apply(ns, upperNSs);

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
						var hash = md5(script);

						var name = shinfos(hash);

						if (!name) {
							try {
								name = global.eval('0, function (namespace_) { return false || ' + script + ' }')(function (name, body) {
									return namespace_.call(global, name, body, getDir(url));
								});
							} catch (e) {
								error('An error occured in file "' + url.substr(_dir.length) + '".', 1);
							}
							shinfos(hash, name);
						}

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
				forin_(from, function (v, i) {
					to[i] = v;
				});
			else
				forin_(from, function (v, i) {
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

//CORE NAMESPACE

namespace_('lang', function () {
	this.isArray = function () {

	};
});



