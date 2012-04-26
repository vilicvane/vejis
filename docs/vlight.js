/*
Based on Vlight JS/HTML/CSS Code Highlight
Deleted HTML & CSS support in this file

Full version
http://www.vilic.info/download/vlight.js

Version 1.0.0

By VILIC VANE
http://www.vilic.info/

©2010-2011 Groinup Studio
All rights reserved.

Redistribution and use in source and binary forms,
with or without modification, are permitted provided
that the following conditions are met:
Redistributions of source code must retain the above
copyright notice, this list of conditions and the
following disclaimer.
Redistributions in binary form must reproduce the
above copyright notice, this list of conditions and
the following disclaimer in the documentation and/or
other materials provided with the distribution.
Neither the name of the Groinup Studio nor the names
of its contributors may be used to endorse or promote
products derived from this software without specific
prior written permission.
*/

(function () {
    var isReady = false;

    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', ready, false);
        window.addEventListener('load', ready, false);
    }
    else if (document.attachEvent) {
        document.attachEvent('onreadystatechange', ready);
        window.attachEvent('onload', ready);
    }

    function ready() {
        if (isReady) return;
        isReady = true;
        onload();
    }

    function onload() {
        setTimeout(function () {
            var className = 'vlight', //自定义类名
                maxLineCount = 0, //最多同时显示的行数
                lineHeight = 16, //行高
                scrollBarWidth = 24, //预计滚动条宽度
                cssText = ( //CSS内容 border: solid 1px #FFF3D0;
                    'div.vlight { position: relative; margin: 10px 0px; line-height: ' + lineHeight + 'px; color: #2F4160; font-size: 12px; font-family: Courier New, monospace; white-space: nowrap; background-color: #FFFFFF; overflow: hidden; }' +
                    'div.vlight div.vlight_top { padding-right: 10px; height: 5px; background-color: #2F4160; font-size: 0px; }' +
                    'div.vlight a.vlight_link { color: #FFFFFF!important; text-decoration: none!important; }' +
                    'div.vlight a.vlight_link:hover { text-decoration: underline!important; }' +
                    'div.vlight div.vlight_left { position: absolute; width: 65px; left: 0px; text-align: right; color: #7D889C; overflow: hidden; }' +
                    'div.vlight div.vlight_left div { position: relative; width: 40px; left: 0px; padding-right: 5px; border-left: solid 16px #F7F8F9; border-right: solid 4px #C1C6D0; }' +
                    'div.vlight div.vlight_main { position: relative; margin-left: 65px; padding-left: 5px; overflow-x: scroll; overflow-y: auto; }' +
                    'div.vlight div.vlight_bottom { height: 5px; background-color: #2F4160; font-size: 0px; }' +
                    'div.vlight span.vlight_cm { color: #669900; }' +
                    'div.vlight span.vlight_re { color: #6382B4; }' +
                    'div.vlight span.vlight_st { color: #6382B4; }' +
                    'div.vlight span.vlight_ky { color: #849CC4; }'
                ).replace(/vlight/g, className); //替换类名

            createStyle(cssText); //创建样式

            var eles = getElementsByClassName(className); //获取元素

            var spanl = '<span class="' + className + '_', //初始化标签
                spanm = '">',
                spanr = '</span>';

            //处理每一个类名符合的元素
            for (var i = 0; i < eles.length; i++) (function (ele) {
                var div = document.createElement('div');
                div.className = className;
                div.innerHTML = (
                    '<div class="vlight_top"></div>' +
                    '<div class="vlight_left"></div>' +
                    '<div class="vlight_main"></div>' +
                    '<div class="vlight_bottom"></div>'
                ).replace(/vlight/g, className);

                var top = div.childNodes[0],
                    left = div.childNodes[1],
                    main = div.childNodes[2];

                var oText;
                if (ele.tagName == 'TEXTAREA') oText = ele.value; //如果是textarea则直接取value
                else if (ele.tagName == 'PRE') oText = ele.innerText || ele.innerHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                else oText = htmlToText(ele.innerHTML);

                var text = convertJS(oText);
                var result = finalDeal(text); //转换文本到高亮的HTML

                main.innerHTML = result.html;

                //创建行号
                var lines = ''
                for (var i = 1; i <= result.count; i++)
                    lines += i + '<br />';
                left.innerHTML = '<div>' + lines + '</div>';

                //将原来的元素替换成代码高亮区域
                ele.parentNode.replaceChild(div, ele);

                //设置高宽
                left.style.height = main.style.height = lineHeight * (maxLineCount && result.count > maxLineCount ? maxLineCount : result.count) + scrollBarWidth + 'px';
                left.childNodes[0].style.height = result.count * lineHeight + scrollBarWidth + 'px';

                //绑定事件
                addEvent(window, 'resize', resize);
                addEvent(main, 'scroll', scroll);

                resize(); //初始化

                function resize() {
                    try {
                        main.style.width = top.offsetWidth - left.offsetWidth - 5 + 'px';
                    } catch (e) { }
                }

                function scroll() {
                    left.childNodes[0].style.marginTop = -main.scrollTop + 'px';
                }
            })(eles[i]);

            function htmlToText(html) {
                return html.replace(/\r?\n/g, '').replace(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi, '$2\r\n\r\n').replace(/<div(\s[^>]*)?>([\s\S]*?)<\/div>/gi, '$2\r\n').replace(/<([a-z]+)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '$3').replace(/<br[^>]*>/gi, '\r\n').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            }

            function textToHTML(text) {
                return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }

            function convertJS(text) {
                var names = ['cm', 're', 'st', 'ky']; //类名的后缀

                //全局正则表达式
                var globalRE = /\/\*[\s\S]*?\*\/|\/\/.*|(['"])(?:.*?[^\\](?:\\\\)*?)?\1|(\/.*?[^\\](?:\\\\)*?\/[gim]{0,3})|([^\w]|^)(break|delete|function|return|typeof|case|do|if|switch|var|catch|else|in|this|void|continue|false|instanceof|throw|while|debugger|finally|new|true|with|default|for|null|try)(?=[^\w]|$)/g;

                //拆分开的正则表达式
                var res = [
                    /^(\/\*[\s\S]*?\*\/|\/\/.*)$/,
                    /^\/.*?[^\\](?:\\\\)*?\/[gim]{0,3}$/,
                    /^(['"])(?:.*?[^\\](?:\\\\)*?)?\1$/,
                    /(break|delete|function|return|typeof|case|do|if|switch|var|catch|else|in|this|void|continue|false|instanceof|throw|while|debugger|finally|new|true|with|default|for|null|try)$/
                ];

                text = textToHTML(text); //符号处理

                //匹配
                text = text.replace(globalRE, function (s) {
                    for (var i = 0; i < res.length; i++) {
                        if (!res[i].test(s)) continue;
                        var spanl2m = spanl + names[i] + spanm;

                        s = s.replace(res[i], function (s) {
                            return spanl2m + s + spanr; //加标签
                        });
                        return s;
                    }
                });

                return text;
            }

            function finalDeal(text) {
                var count = 1; //行数
                //字符处理
                text = text.replace(/\t/g, '    ').replace(/  /g, '&nbsp; ').replace(/  /g, ' &nbsp;').replace(/(\r?\n)+$/g, '').replace(/\r?\n/g, function () { count++; return '<br />'; });
                return { html: text, count: count };
            }
        }, 0);
    }

    function addEvent(object, name, handler) {
        if (object.addEventListener) object.addEventListener(name, handler, false);
        else if (object.attachEvent) object.attachEvent('on' + name, handler);
    }

    function createStyle(cssText) {
        if (document.createStyleSheet)
            document.createStyleSheet().cssText = cssText;
        else {
            var style = document.createElement('style');
            style.type = 'text/css';
            style.textContent = cssText;
            document.getElementsByTagName('head')[0].appendChild(style);
        }
    }

    function getElementsByClassName(className) {
        var eles = document.getElementsByTagName('*');
        var arr = [];
        var re = new RegExp('^(.* )?' + className + '( .*)?$');
        for (var i = 0, ele; ele = eles[i]; i++)
            if (re.test(ele.className)) arr.push(ele);
        return arr;
    }
})();