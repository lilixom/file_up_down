/**
 * Created by Administrator on 2015/10/22.
 * not supput cross domain download
 */
(function() {
    "use strict"

    var setting = {
        prepareCallback: function(url) {},
        successCallback: function(url) {},
        failCallback: function(error) {},
        completeCallback: function(url) {},
        httpMethod: "GET",
        data: null,
        checkInterval: 1000,
        cookieName: "downloadToken"
    }

    var FileClient = function() {
            var self = this;
            var $iframe, $form, $iframeDoc, fileDownloadCheckTimer, callbacks;
            this.download = function(url, options) {

                //initialize
                options = options || {}
                setting.data = options.data || setting.data;
                setting.httpMethod = options.httpMethod || setting.httpMethod;
                setting.failCallback = options.failCallback || setting.failCallback;
                setting.prepareCallback = options.prepareCallback || setting.prepareCallback;
                setting.successCallback = options.successCallback || setting.successCallback;
                setting.completeCallback = options.completeCallback || setting.completeCallback;
                callbacks = {
                    onPrepare: function(url) {
                        if (setting.prepareCallback) {
                            setting.prepareCallback(url);
                        }
                    },

                    onSuccess: function(url) {
                        setting.successCallback(url);
                    },

                    onFail: function(error) {
                        setting.failCallback(error);
                    },

                    onComplete: function(url) {
                        setting.completeCallback(url);
                    }
                };


                callbacks.onPrepare(url);

                //Json
                if (setting.data !== null && typeof setting.data === "string") {
                    setting.data = JSON.parse(setting.data);
                }


                if (callbacks.prepareCallback) {
                    callbacks.prepareCallback(url);
                }
                var temp = document.createDocumentFragment();

                $iframe = document.createElement("iframe");
                $iframe.setAttribute("style", "display: none");
                $iframe.setAttribute("name", "ifmDownload");
                $iframe.setAttribute("src", "about:blank");
                $iframe.setAttribute("sandbox", "allow-same-origin");

                temp.appendChild($iframe);

                $form = document.createElement("form");
                $form.setAttribute("target", "ifmDownload");
                var httpMethodUpper = setting.httpMethod.toUpperCase();

                if (httpMethodUpper === "GET") {
                    $form.setAttribute("method", "GET");
                } else {
                    $form.setAttribute("method", "post");
                }
                $form.setAttribute("action", url);
                if ($form.attachEvent) {
                    $form.attachEvent("onsubmit", detectDownloadComplete);
                } else if ($form.addEventListener) {
                    $form.addEventListener("submit", detectDownloadComplete, false);
                } else {
                    $form.onsubmit = detectDownloadComplete
                }

                //form hidden input data
                //create submit input   
                var item = [];
                if (setting.data !== null && typeof setting.data === "object") {
                    for (var ppy in setting.data) {
                        var key = decodeURIComponent(ppy);
                        if (key) {
                            var value = decodeURIComponent(setting.data[ppy]);
                            item.push('<input type="hidden" name="', key, '" value="', value, '" />');
                        }
                    }
                }

                var token = new Date().getTime(); //use the current timestamp as the token value
                item.push('<input type="hidden" name="', setting.cookieName, '" value="', token, '">');
                $form.innerHTML = item.join("");

                var $submit = document.createElement("input");
                $submit.setAttribute("type", "submit");
                $submit.setAttribute("style", "display:none");
                $form.appendChild($submit);
                temp.appendChild($form);

                document.getElementsByTagName("body")[0].appendChild(temp);
                //after append to html document add listener for downloader error Detect
                if ($iframe.attachEvent) {
                    $iframe.attachEvent("onload", DetectDownloadFail);
                } else if ($iframe.addEventListener) {
                    $iframe.addEventListener("load", DetectDownloadFail, false);
                } else {
                    $iframe.onloader = DetectDownloadFail
                }

                $iframeDoc = getiframeDocument($iframe);
                $submit.click();


                function getCookie(doc, name) {
                    doc = document;
                    var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
                    if (arr = doc.cookie.match(reg))
                        return unescape(arr[2]);
                    else
                        return null;
                }

                function setCookie(doc, name, value) {
                    doc = document;
                    if (value) {
                        var Days = 30;
                        var exp = new Date();
                        exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
                        doc.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
                    }
                }

                function delCookie(doc, name) {
                    //not support cross domain
                    doc = document;
                    var exp = new Date();
                    exp.setTime(exp.getTime() - 1);
                    var cval = getCookie(doc, name);
                    if (cval != null)
                        doc.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
                }

                function detectDownloadComplete() {
                    fileDownloadCheckTimer = window.setInterval(function() {
                        var token = document.getElementsByName(setting.cookieName)[0].value
                        if (getCookie($iframeDoc, setting.cookieName) == token) {
                            clearElement();
                            if (callbacks.onSuccess) {
                                callbacks.onSuccess(url);
                            }
                            if (callbacks.onComplete) {
                                callbacks.onComplete(url);
                            }
                        }
                    }, setting.checkInterval);
                }

                function clearElement() {
                    window.clearInterval(fileDownloadCheckTimer);
                    delCookie($iframeDoc, setting.cookieName); //clears this cookie value
                    if ($form) {
                        if ($form.remove) {
                            $form.remove();
                        } else {
                            $form.removeNode(true);
                        }
                    }
                    if ($iframe) {
                        if ($iframe.remove) {
                            $iframe.remove();
                        } else {
                            $iframe.removeNode(true); //默认不删除子节点
                        }
                    }
                }

                function getiframeDocument($iframe) {

                    var iframeDoc = $iframe.contentWindow || $iframe.contentDocument;
                    if (iframeDoc.document) {
                        iframeDoc = iframeDoc.document
                    }
                    return iframeDoc;
                };

                /**
                 * Detect Download file Fail return html page to be 
                 */
                function DetectDownloadFail() {

                    clearElement();
                    if (callbacks.onFail) {
                        var data = $iframeDoc.body.innerHTML;
                        callbacks.onFail(data);
                    }
                    if (callbacks.onComplete) {
                        callbacks.onComplete(url);
                    }
                };
            }
        }
        /*
         *
         * 
         */
    if (typeof define == 'function' && define.amd) {
        define(function() {
            return new FileClient();
        });
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports.FileClient = new FileClient();
    } else {
        window.FileClient = new FileClient();
    }
})();