/// <reference path="/dev/vejis.intellisense.js" />
/// <reference path="dom.js" />

/*
    Based on Vlight JS/HTML/CSS Code Highlight
    Deleted HTML & CSS support in this file

    Version 1.1.0

    By VILIC VANE
    http://www.vilic.info/

    Copyright 2010-2012, VILIC VANE
    Licensed under the MIT license.
*/

use_("dom", function (dom) {
    dom.ready(function () {
        setTimeout(function () {
            var className = "vlight", //自定义类名
                maxLineCount = 0, //最多同时显示的行数
                lineHeight = 16, //行高
                scrollBarWidth = 24, //预计滚动条宽度
                cssText = ( //CSS内容 border: solid 1px #FFF3D0;
                    "div.vlight { position: relative; margin: 10px 0px 20px 0px; line-height: " + lineHeight + "px; color: #2F4160; font-size: 12px; font-family: Courier New, monospace; white-space: nowrap; background-color: #FFFFFF; overflow: hidden; }" +
                    "div.vlight div.vlight_top { padding-right: 10px; height: 5px; background-color: #2F4160; font-size: 0px; }" +
                    "div.vlight a.vlight_link { color: #FFFFFF!important; text-decoration: none!important; }" +
                    "div.vlight a.vlight_link:hover { text-decoration: underline!important; }" +
                    "div.vlight div.vlight_left { position: absolute; width: 65px; left: 0px; text-align: right; color: #7D889C; overflow: hidden; }" +
                    "div.vlight div.vlight_left div { position: relative; width: 40px; left: 0px; padding-right: 5px; border-left: solid 16px #F7F8F9; border-right: solid 4px #C1C6D0; }" +
                    "div.vlight div.vlight_main { position: relative; margin-left: 65px; padding-left: 5px; overflow-x: scroll; overflow-y: auto; }" +
                    "div.vlight div.vlight_bottom { height: 5px; background-color: #2F4160; font-size: 0px; }" +
                    "div.vlight span.vlight_cm { color: #669900; }" +
                    "div.vlight span.vlight_re { color: #6382B4; }" +
                    "div.vlight span.vlight_st { color: #6382B4; }" +
                    "div.vlight span.vlight_kw { color: #849CC4; }"
                ).replace(/vlight/g, className); //替换类名

            dom.createStyleSheet(cssText); //创建样式

            var eles = dom.query("." + className); //获取元素

            var spanl = '<span class="' + className + "_", //初始化标签
                spanm = '">',
                spanr = "</span>";

            //处理每一个类名符合的元素
            for (var i = 0; i < eles.length; i++) (function (ele) {
                var div = document.createElement("div");
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
                if (ele.tagName == "TEXTAREA") oText = ele.value; //如果是textarea则直接取value
                else if (ele.tagName == "PRE") oText = ele.innerText || ele.innerHTML.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
                else oText = htmlToText(ele.innerHTML);

                var text = convertJS(oText);
                var result = finalDeal(text); //转换文本到高亮的HTML

                main.innerHTML = result.html;

                //创建行号
                var lines = ""
                for (var i = 1; i <= result.count; i++)
                    lines += i + "<br />";
                left.innerHTML = "<div>" + lines + "</div>";

                //将原来的元素替换成代码高亮区域
                ele.parentNode.replaceChild(div, ele);

                //设置高宽
                left.style.height = main.style.height = lineHeight * (maxLineCount && result.count > maxLineCount ? maxLineCount : result.count) + scrollBarWidth + "px";
                left.childNodes[0].style.height = result.count * lineHeight + scrollBarWidth + "px";

                //绑定事件
                dom.on(window, "resize", resize);
                dom.on(main, "scroll", scroll);

                resize(); //初始化

                function resize() {
                    try {
                        main.style.width = top.offsetWidth - left.offsetWidth - 5 + "px";
                    } catch (e) { }
                }

                function scroll() {
                    left.childNodes[0].style.marginTop = -main.scrollTop + "px";
                }
            })(eles[i]);

            function htmlToText(html) {
                return html.replace(/\r?\n/g, "").replace(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi, "$2\r\n\r\n").replace(/<div(\s[^>]*)?>([\s\S]*?)<\/div>/gi, "$2\r\n").replace(/<([a-z]+)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, "$3").replace(/<br[^>]*>/gi, "\r\n").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
            }

            function textToHTML(text) {
                return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            }

            function convertJS(text) {
                var names = ["", "cm", "st", "", "re", "kw"]; //类名的后缀

                //全局正则表达式
                var globalRE = /(\/\*[\s\S]*?\*\/|\/\/.*)|((['"])(?:\\[\s\S]|[^\\\r\n])*?\3)|(\/(?:\\.|[^\\\r\n])*?\/[gim]{0,3})|((?:[^\w]|^)(?:break|delete|function|return|typeof|case|do|if|switch|var|catch|else|in|this|void|continue|false|instanceof|throw|while|debugger|finally|new|true|with|default|for|null|try)(?=[^\w]|$))/g;

                text = textToHTML(text); //符号处理

                //匹配
                text = text.replace(globalRE, function (m, cmt, str, g3, re, kw) {
                    var i, s;
                    for (i = 1; s = arguments[i], i < 5; i++) {
                        if (s)
                            return spanl + names[i] + spanm + s + spanr;
                    }

                    s = s.replace(/\w+/, function (kw) {
                        return spanl + names[i] + spanm + kw + spanr;
                    });

                    return s;
                });

                return text;
            }

            function finalDeal(text) {
                var count = 1; //行数
                //字符处理
                text = text.replace(/\t/g, "    ").replace(/\r?\n\s*$/, "").replace(/  /g, "&nbsp; ").replace(/  /g, " &nbsp;").replace(/\r?\n/g, function () { count++; return "<br />"; });
                return { html: text, count: count };
            }
        }, 0);
    });
});