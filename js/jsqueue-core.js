window.core = {
    version: "1.0.0"
};

core.data = {
    process_statment: function (str,mode) {
        var match, ret_str = str;
        mode=mode||'string'
        //var re = /([a-zA-Z]*:\/\/[a-zA-Z_\/\.0-9\@\s\#\*]*)/g;
        var re= /([a-zA-Z\.]*:\/\/[a-zA-Z_\/\.0-9@\s\#\*\-]*(\[.*?\])*[a-zA-Za.\_]*[\:]{0,1})/g;
        while (match = re.exec(str)) {
            if(mode=='string')
                ret_str = ret_str.replace(match[1], '"' + core.data.uritodata(match[1]) + '"');
            else
                ret_str = ret_str.replace(match[1],  core.data.uritodata(match[1]));
        }
        return ret_str;
    },
    htmlinject: function (html,safe) {
        var match, ret_str = html;
        if(safe===undefined)
            safe=true;

        /**
         * Match in indexs
         * @type {RegExp}
         */
        for (var i in jsqueue.loops) {
            var re = new RegExp("\~" + i + "\~", "g");
            while (match = re.exec(html)) {
                ret_str = ret_str.replace("~" + i + "~", jsqueue.loops[i]);
            }

        }
        html = ret_str;

        /**
         * Match in uri data
         * @type {RegExp}
         */

        /**
         * TODO: Test addition of \:.. This could overrun the detection.
         * @type {RegExp}
         */
        var re = /\~([a-zA-Z\.]*:\/\/[a-zA-Z_\/\.0-9@\s\#\*\-]*(\[.*?\])*[a-zA-Za.\_]*[\:]{0,1})/g;
        while (match = re.exec(html)) {
            var rep_match = match[1];
            var uri_match = match[1].replace(/\:$/, '');
            ret_str = ret_str.replace("~" + rep_match, this.uritodata(uri_match));
        }

        var re = /\@([a-zA-Z0-9\_]*\(.*\))/g;
        html=ret_str;
        while (match = re.exec(html)) {
            var js_match = match[1];
            var eval_res=eval(match[1]);
            ret_str = ret_str.replace("@" + js_match, eval_res);
        }
        if(safe) {
            ret_str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        return ret_str;
    },
    uritodata: function (uri,concat) {
        // console.log(uri);
        function index(obj, i) {
            var matches = i.match(/^@(.*)/)
            if (matches) {
                return matches[1];
            }
            matches = i.match(/^\*(.*)/)
            if (matches) {
                return JSON.stringify(obj[matches[1]]);
            }
            if (obj!==undefined)
                return obj[i];
            return '';
        }

        /**
         * Find any [ ] sub uri's
         * @type {RegExp}
         */

        var uris = uri.split(',');

        var ret_uri='';
        for (var i = 0; i < uris.length; i++) {
            if(concat!==undefined&&concat===true) {
                ret_uri+= get_uri(uris[i])+' ';
            } else {
                ret_uri = get_uri(uris[i]);
                if (ret_uri)
                    break;
            }

        }

        return ret_uri;

        function get_uri(uri) {
            var ret_str = uri;
            var re = /\[([a-zA-Z\.]*:\/\/[a-zA-Z_\/\.0-9@\s\#\*\-]*)\]/g;
            while (match = re.exec(uri)) {
                ret_str = ret_str.replace("[" + match[1] + "]", "." + core.data.uritodata(match[1]));
            }
            uri = ret_str;
            var match = uri.match(/(.*?):\/\/(.*)/);
            var value;
            switch (match[1]) {
                case 'global':
                    value = match[2].split('.').reduce(index, window);
                    return value;
                case 'jquery':
                    var clean = match[2].replace(/\//, '');
                    value = $(clean).val();
                    return value;
                case 'reg':
                    var clean = match[2].replace(/\//, '');
                    value = jsqueue.get_reg(clean);
                    return value;
                case 'request':
                    var clean = match[2].replace(/\//, '');
                    return core.data.getUrl(clean);
                case 'stack':
                    var uri = match[2].match(/(.*?)\/(.*)/);
                    var stack_ptr = uri[1].split('.').reduce(index, jsqueue.stack);
                    if (uri[2]) {
                        value = uri[2].split('.').reduce(index, stack_ptr);
                    }
                    else
                        value = stack_ptr;
                    if (value === undefined)
                        return '';
                    return value;
                default:
                    return 'data uri [' + match[1] + '] is not valid';
            }
        }
    },
    check_params: function (format, data) {
        var result = true;
        for (var i in format) {
            if (data[i]===undefined) {
                console.error(format[i].message);
                result = false;
            }
        }
        return result;
    },
    serializer: function (key, value) {
        if (typeof value === 'object')
            return 'Object';
        return value;

    },
    datamunge: function (data) {
        var self = this;
        $.each(data, function (key, val) {
            self.datamunge_recursive(key, val, data, data, 0);
        });
    },
    datamunge_recursive: function (key, val, data, to, depth) {
        var self = this;
        if (depth > 10)
            return;
        if (val instanceof Object) {
            $.each(val, function (mkey, mval) {
                self.datamunge_recursive(mkey, mval, data, to[key], depth+1)
            });
        } else {
            var matches;
            if (typeof val == "string" && (matches = val.match(/\!jquery:([#a-zA-Z\-_\.0-9]*)[:]{0,1}/))) {
                var clean_match = matches[1].replace(/:.*/, '');
                if (jQuery(clean_match).is('input:not(:checkbox),textarea,select')) {
                    to[key] = val.replace(/\!jquery:[#a-zA-Z\-_\.0-9]*[:]{0,1}/, jQuery(clean_match).val());
                } else if (jQuery(clean_match).is(':checkbox')) {
                    if (jQuery(clean_match).is(':checked')) {
                        to[key] = val.replace(/\!jquery:[#a-zA-Z\-_\.0-9]*[:]{0,1}/, jQuery(clean_match).val());
                    } else {
                        to[key] = '';
                    }
                } else {
                    to[key] = val.replace(/\!jquery:[#a-zA-Z\-_\.0-9]*[:]{0,1}/, jQuery(clean_match).html());
                }
            }
            if (typeof val == "string" && (matches = val.match(/\!data:(.*)[:]{0,1}/))) {
                var clean_match = matches[1].replace(/:.*/, '');

                function index(obj, i) {
                    return obj[i];
                }

                var value = clean_match.split('.').reduce(index, data);
                if (val.match(/^\!data:(.*)[:]{0,1}$/))
                    to[key] = value;
                else
                    to[key] = val.replace(/\!data:.*[:]{0,1}/, value);

                // to[key] =value;
            }
            if (typeof val == "string" && (matches = val.match(/\!stack:\/\/([#a-zA-Z\-_\.0-9\/\*]*)[:]{0,1}/))) {
                var clean_match = matches[1].replace(/:.*/, '');
                matches = clean_match.split('/');
                clean_match = matches[1];
                data = jsqueue.stack[matches[0]];
                function index(obj, i) {
                    var matches = i.match(/^\*(.*)/)
                    if (matches) {
                        return JSON.stringify(obj[matches[1]]);
                    }
                    return obj[i];
                }
                var value =undefined;

                if(clean_match!=='')
                    value = clean_match.dotsplit().reduce(index, data);
                else value=data;
                if (Object.prototype.toString.call(value) === '[object Array]'||typeof value ==='object') {
                    to[key] = value;
                } else {
                    to[key] = val.replace(/\!stack:\/\/[#a-zA-Z\-_\.0-9\/]*[:]{0,1}/, value);
                }

            }
            if (typeof val == "string" && (matches = val.match(/\!request:([#a-zA-Z\-_\.0-9]*)[:]{0,1}/))) {


                var clean_match = matches[1].replace(/:.*/, '');

                to[key] = val.replace(/\!request:[#a-zA-Z\-_\.0-9]*[:]{0,1}/, core.data.getUrl(clean_match));
            }

        }
    },
    getUrl: function (name) {
        if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search)) {
            return decodeURIComponent(name[1]);
        }
        return false;

    }

};

String.prototype.dotsplit =function() {
    var pre_string=String(this).replace(/\.\./,'-DOTSTR-');
    var split_string=pre_string.split('.');
    for(var i=0;i<split_string.length;i++) {
        split_string[i]=split_string[i].replace('-DOTSTR-','.');
    }
    return split_string;
};

core.forms = {

    encode: function (form, data) {
        $(form + ' .rest-field').each(function (i, ptr) {
            var path = $(this).attr('data-send').split('.');
            var obj = data;
            for (var i = 0; i < path.length; i++) {
                if (!obj[path[i]]) {
                    obj[path[i]] = {};
                }
                if (path.length != (i + 1))
                    obj = obj[path[i]];
                else {
                    if ($(this).is(':checkbox')) {
                        if ($(this).is(':checked')) {
                            if ($(this).attr('data-mode') == 'csv') {
                                if (typeof obj[path[i]] == "object")
                                    obj[path[i]] = '';
                                var sep = '';
                                if (obj[path[i]]) {
                                    sep = ',';
                                }
                                obj[path[i]] += sep + $(this).val();
                            } else {
                                obj[path[i]] = $(this).val();
                            }
                        } else {
                            if ($(this).attr('data-off'))
                                obj[path[i]] = $(this).attr('data-off');
                        }
                    } else {
                        if ($(this).attr('data-encode') == 'json')
                            obj[path[i]] = JSON.parse($(this).val());
                        else {
                            if ($(this).attr('data-ptr'))
                                obj[path[i]] = $($(this).attr('data-ptr')).val();
                            else
                                obj[path[i]] = $(this).val();
                        }
                    }
                    break;
                }
            }
        });

    }

};

