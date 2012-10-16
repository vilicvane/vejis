/// <reference path="vejis.js" />

module_("dom", function () {
    var dom = this;

    this.ready = function () {
        var isReady = document.readyState == "complete",
            queue = [];

        if (!isReady) {
            if (document.addEventListener) {
                document.addEventListener("DOMContentLoaded", ready, false);
                window.addEventListener("load", ready, false);
            }
            else if (document.attachEvent) {
                document.attachEvent("onreadystatechange", ready);
                window.attachEvent("onload", ready);
                var toplevel = false;
                try {
                    toplevel = window.frameElement == null;
                } catch (e) { }
                if (document.documentElement.doScroll && toplevel) {
                    doScrollCheck();
                }
                doScrollCheck();
            }
        }

        return _(Function, function (handler) {
            if (isReady) handler();
            else queue.push(handler);
        });

        function ready() {
            if (isReady) return;
            isReady = true;

            for_(queue, function (fn) {
                fn();
            })

            queue.length = 0;
        }

        function doScrollCheck() {
            if (isReady) return;

            try {
                document.documentElement.doScroll("left");
            } catch (e) {
                setTimeout(doScrollCheck, 1);
                return;
            }

            ready();
        }
    } ();


    this.query = function () {
        var selectors = [
            {
                key: ' #',
                unique: true,
                get: function (rel, id) {
                    if (rel == document) {
                        var ele = document.getElementById(id);
                        if (ele)
                            return [ele];
                    }
                    else {
                        var eles = rel.getElementsByTagName('*');
                        for (var i = 0; i < eles.length; i++)
                            if (eles[i].id == id)
                                return [eles[i]];
                    }
                    return [];
                }
            },
            {
                key: ' .',
                unique: false,
                get: function (rel, className) {
                    var eles = rel.getElementsByTagName('*');
                    var rst = [];
                    for (var i = 0, ele; ele = eles[i]; i++)
                        if (dom.containsClass(ele, className))
                            rst.push(ele);
                    return rst;
                }
            },
            {
                key: '>#',
                unique: true,
                get: function (rel, id) {
                    var eles = rel.childNodes;
                    for (var i = 0, ele; ele = eles[i]; i++)
                        if (ele.id == id)
                            return [ele];
                    return [];
                }
            },
            {
                key: '>.',
                unique: false,
                get: function (rel, className) {
                    var eles = rel.childNodes;
                    var rst = [];
                    for (var i = 0, ele; ele = eles[i]; i++)
                        if (dom.containsClass(ele, className))
                            rst.push(ele);
                    return rst;
                }
            },
            {
                key: '#',
                unique: true,
                get: function (rel, id) {
                    if (rel.id == id)
                        return [rel];
                    else return [];
                }
            },
            {
                key: '.',
                get: function (rel, className) {
                    if (dom.containsClass(rel, className))
                        return [rel];
                    else return [];
                }
            },
            {
                key: ' ',
                unique: false,
                get: function (rel, tagName) {
                    return rel.getElementsByTagName(tagName);
                }
            },
            {
                key: '>',
                allowSpace: true,
                unique: false,
                get: function (rel, tagName) {
                    var eles = rel.childNodes;
                    var rst = [];
                    for (var i = 0, ele; ele = eles[i]; i++)
                        if (ele.tagName == tagName.toUpperCase())
                            rst.push(ele);
                    return rst;
                }
            }
        ];

        return _(String, option_(Object, [document]), function (selector, rel) {
            selector = ' ' + trim(selector).replace(/\s+/g, ' ');

            for (var i = 0, s; s = selectors[i]; i++)
                if (s.allowSpace)
                    selector = selector.replace(new RegExp(' ?(\\' + s.key.split('').join('\\') + ') ?', 'i'), '$1');

            var rels = is_(rel, IList) ? rel : [rel];
            var unique;

            var eles = getEles(selector, rels);

            if (unique) return eles[0];
            else return eles;

            function getEles(selector, rels) {
                var eles = [];

                var re = /^([\w-]+|\*)/i;
                for (var i = 0, s; s = selectors[i]; i++) {
                    var key = s.key;
                    if (selector.indexOf(key) == 0) {
                        selector = selector.substr(key.length);
                        var word = (selector.match(re) || [])[0];
                        if (!word) return [];
                        selector = selector.substr(word.length);

                        for (var j = 0, rel; rel = rels[j]; j++)
                            append(eles, s.get(rel, word));

                        if (s.unique != undefined)
                            unique = s.unique;

                        break;
                    }
                }

                return selector ? getEles(selector, eles) : eles;
            }

        });

        function append(arr, items) {
            main:
            for (var i = 0; i < items.length; i++) {
                for (var j = 0; j < arr.length; j++)
                    if (items[i] == arr[j])
                        continue main;
                arr.push(items[i]);
            }
        }
    } ();


    this.containsClass = _(Object, String, function (ele, className) {
        return new RegExp('^(.*\\s)?' + className + '(\\s.*)?$').test(ele.className);
    });

    this.addClass = _(Object, String, function (ele, className) {
        if (!dom.containsClass(ele, className)) {
            ele.className = trim(ele.className + ' ' + className);
            return true;
        }
        return false;
    });

    this.removeClass = _(Object, String, function (ele, className) {
        var newCN = ele.className.replace(new RegExp('\\s*' + className + '\\s*', 'g'), ' ');
        if (ele.className != newCN) {
            ele.className = trim(newCN);
            return true;
        }
        return false;
    });

    this.toggleClass = _(Object, String, option_(Boolean), function (ele, className, opt_bool) {
        var bool = opt_bool != undefined ? opt_bool : !dom.containsClass(ele, className);

        if (bool)
            dom.addClass(ele, className);
        else
            dom.removeClass(ele, className);

        return bool;
    });

    this.replaceClass = _(Object, String, String, function (ele, oldClass, newClass) {
        if (dom.removeClass(ele, oldClass)) {
            dom.addClass(ele, newClass);
            return true;
        }
        return false;
    });

    /* dom operation */

    this.create = _(String, option_(Boolean, false), function (html, opt_forceArray) {
        var temp = document.createElement('div');
        temp.innerHTML = html;
        var nodes = temp.childNodes;
        if (opt_forceArray || nodes.length > 1) {
            var eles = [];
            var node;
            while (node = nodes[0]) {
                eles.push(node);
                temp.removeChild(node);
            }
            return eles;
        }
        return nodes[0];
    });

    this.clearChildNodes = _(Object, function (ele) {
        var nodes = ele.childNodes;
        while (nodes[0])
            ele.removeChild(nodes[0]);
    });

    this.contains = _(Object, Object, function (child, parent) {
        do {
            if (child.parentNode == parent)
                return true;
        }
        while (child = child.parentNode);
        return false;
    });

    this.remove = _(Object, function (ele) {
        if (ele.parentNode)
            ele.parentNode.removeChild(ele);
    });

    /* style */

    this.setStyle = _(params_(Object), PlainObject, function (eles, styles) {
        for_(eles, function (ele) {
            forin_(styles, function (value, style) {
                ele.style[style] = value.toString();
                if (style == "opacity" && "filter" in ele.style)
                    ele.style.filter = "alpha(opacity=" + Math.round(value * 100) + ")";
            });
        });
    });

    this.createStyleSheet = _(String, function (cssText) {
        if (document.createStyleSheet)
            document.createStyleSheet().cssText = cssText;
        else {
            var style = document.createElement('style');
            style.type = 'text/css';
            style.textContent = cssText;
            dom.query('head')[0].appendChild(style);
        }
    });

    this.hide = _(params_(Object), function (eles) {
        for_(eles, function (ele) {
            ele.style.display = "none";
        });
    });

    this.show = _(params_(Object), function (eles) {
        for_(eles, function (ele) {
            ele.style.display =
            /^(AABBR|ACRONYM|B|BDO|BIG|BR|CITE|CODE|DFN|EM|I|IMG|INPUT|KBD|LABEL|Q|SAMP|SELECT|SMALL|SPAN|STRONG|SUB|SUP|TEXTAREA|TT|VAR)$/i.test(ele.tagName) ?
            "inline" :
            "block";
        });
    });

    /* event */
    this.on =
    _(Object, params_(String), Function, function (ele, events, handler) {
        if (ele.addEventListener) {
            for_(events, function (event) {
                ele.addEventListener(event, handler, false);
            });
        }
        else if (ele.attachEvent) {
            for_(events, function (event) {
                ele.attachEvent("on" + event, function () {
                    var e = window.event;

                    e.relatedTarget = e.toElement;
                    e.target = e.srcElement;

                    e.preventDefault = function () {
                        e.returnValue = false;
                    };
                    e.stopPropagation = function () {
                        e.cancelBubble = true;
                    };

                    handler.call(this, e);
                });
            });
        }
    });

    this.fireEvent = _(Object, String, function (ele, event) {
        var e = document.createEvent("Event");
        e.initEvent(event, true, true);
        return ele.dispatchEvent(e);
    });

    /*
    this.removeEventListener =
    _(Object, String, Function, function (ele, event, handler) {
    if (ele.removeEventListener)
    ele.removeEventListener(event, handler, false);
    else if (ele.detachEvent)
    ele.detachEvent("on" + event, handler);
    });
    */

    /* common stuffs */

    function trim(s) {
        return s.replace(/^\s+|\s+$/g, "");
    }
});