/**
 *  jsqueue-tools.js (c) 2014 richard@nautoguide.com
 */

(function ($) {

    "use strict";

    function jsTools(element, options) {
        var self = this;
        self.options = options;

        if (self.options.uri) {
            self.options.uri = core.data.htmlinject(self.options.uri);
        }

        self.$element = $(element);

        // Commands
        $(element).on({
            "command": function (event, cmd, data) {
                if(self[cmd])
                    self[cmd](data);
                else
                    console.warn('Error no cmd:'+cmd);
            }
        });
        jsqueue.activate('TOOLS');

    }


    jsTools.prototype = {
        constructor: jsTools,
        TOOLS_FULLSCREEN: function(data){
            var doc = window.document;
            var docEl = doc.documentElement;

            var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
            var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

            if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
                requestFullScreen.call(docEl);
            }
            else {
                cancelFullScreen.call(doc);
            }
            console.log('full screen');
        },
        TOOLS_RUN: function(data) {
            $(data.target).trigger('run');
            jsqueue.finished(data.PID);
        },
        TOOLS_CLICK: function(data) {
            $(data.target).click();
            jsqueue.finished(data.PID);
        },
        TOOLS_IF: function(data) {
            function index(obj,i) {
                if(obj)
                    return obj[i];
                return '';
            }
            var value=data.if_path.split('.').reduce(index,data);
            if(value!==data.if_check) {
                jsqueue.logicfail(data.PID);
            }
            jsqueue.finished(data.PID);
        },
        /**
         * Update a form value
         * @param data
         * @constructor
         */
        TOOLS_UPDATE_VALUE: function (data) {
            //if(data.value.match(/\!EVAL:/))
            $(data.element).val(data.value);
            jsqueue.finished(data.PID);
        },
        TOOLS_UPDATE_VALUE_EVAL: function (data) {
            $(data.element).val(eval(data.value));
            jsqueue.finished(data.PID);
        },

        TOOLS_EXECUTE_TEMPLATE: function (data) {
            $('#command-window').html($(data.template).render(data));
            jsqueue.add({
                'component': 'WORKFLOW',
                'command': 'WORKFLOW_START'
            });
            jsqueue.finished(data.PID);
        },

        TOOLS_UPDATE_VALUE_WITH_VALUE: function (data) {
            var from_value = $(data.passed_element).val();
            $(data.element).val(from_value);
            jsqueue.finished(data.PID);
        },

        TOOLS_UPDATE_VALUE_WITH_HTML: function (data) {
            var from_value = $(data.passed_element).html();
            $(data.element).val(from_value);
            jsqueue.finished(data.PID);
        },

        TOOLS_UPDATE_HTML: function (data) {
            $(data.element).html(data.value);
            jsqueue.finished(data.PID);
        },

        TOOLS_START_CAROUSEL: function (data) {
            $('.carousel').carousel();
            jsqueue.finished(data.PID);
        },

        TOOLS_SET_ATTRIBUTE: function(data) {
            $(data.target).attr(data.attributes);
            jsqueue.finished(data.PID);
        },

        TOOLS_RELOAD: function(data) {
            window.location.reload();
            jsqueue.finished(data.PID);
        },

        TOOLS_SLIDE_TOGGLE: function(data) {
            var offet=data.offset||20;
            if(data.target) {
                    var obj=$(data.target);
                    if (obj.position()['left'] < 0) {
                        /*obj.animate({
                            'left': '0px'
                        });*/
                        obj.css({
                            'left': '0px'
                        });
                        obj.addClass('active');
                    } else {
                        /*obj.animate({
                            'left': '-' + (obj.width() - offet) + 'px'
                        });*/
                        obj.css({
                            'left': '-' + (obj.width() - offet) + 'px'
                        });
                        obj.removeClass('active');
                    }
            } else {
                console.warn('TOOL_SLIDE_TOGGLE called with no target');
            }
            jsqueue.finished(data.PID);

        },

        TOOLS_FORMAT_DATA: function (data) {
            function index(obj,i) {return obj[i];}
            var formated_data={};
            for(var i in data.paths) {
                if(data.paths[i]=='root') {
                    formated_data[i]=data;
                } else {
                    var fpath= i.split('.');
                    if(fpath.length==1)
                        formated_data[i] = data.paths[i].split('.').reduce(index, data);
                    else {
                        /**
                         *  Crap hack to allow two levels
                         *
                         *  TODO make this recurisve function when time isn't sucking
                         *
                         */
                        formated_data[fpath[0]]={};
                        formated_data[fpath[0]][fpath[1]]=data.paths[i].split('.').reduce(index, data);
                    }
                }
            }
            jsqueue.push(data.PID,formated_data);
            jsqueue.finished(data.PID);
        },
        /**
         * Taking input data and put some into registers for later use maybe in another queue
         * @param data
         * @constructor
         */
        TOOLS_SET_REG: function (data) {
            function index(obj,i) {return obj[i];}
            if(data.path) {
                var value=data.path.split('.').reduce(index,data);
                jsqueue.set_reg(data.reg, value);
            } else {
                jsqueue.set_reg(data.reg, data.value);
            }
            jsqueue.finished(data.PID);
        },

        TOOLS_CLEAR_REG: function (data) {
            jsqueue.clear_reg(data.reg);
            jsqueue.finished(data.PID);
        },

        /**
         * Give a list of elements(toggle their hidden class)
         * @param data
         * @constructor
         */
        TOOLS_TOGGLE_HIDDEN: function (data) {
            for (var i = 0; i < data.elements.length; i++)
                $(data.elements[i]).toggleClass('hidden');
            jsqueue.finished(data.PID);
        },

        /**
         * Give a list of elements(toggle their hidden class)
         * @param data
         * @constructor
         */
        TOOLS_TOGGLE_CLASS: function (data) {
            var self=this;
            if(data.ifclass&&!self.ifclass(data.ifclass)) {
                jsqueue.finished(data.PID);
                return;
            }
            if(data.clear||data.set) {
                $(data.clear).removeClass(data['class']);
                $(data.set).addClass(data['class']);
            } else {
                $(data.target).toggleClass(data['class']);
            }
            jsqueue.finished(data.PID);
        },

        TOOLS_STATE_CLASS: function (data) {
            var self=this;
            if(data.ifclass&&self.ifclass(data.ifclass)) {
                $(data.target).removeClass(data.falseclass);
                $(data.target).addClass(data.trueclass);

            } else {
                $(data.target).removeClass(data.trueclass);
                $(data.target).addClass(data.falseclass);
            }
            jsqueue.finished(data.PID);
        },

        ifclass: function (ifclass) {
            if($(ifclass).length>0)
                return true;
            return false;
        },

        TOOLS_TOGGLE_BETWEEN_CLASS: function (data) {
            if(data.clear||data.set) {
                $(data.clear).removeClass(data['class']);
                $(data.set).addClass(data['class']);
            } else {
                $(data.target).toggleClass(data['class']);
            }
            jsqueue.finished(data.PID);
        },

        TOOLS_UPDATE_CLASS: function (data) {
            data.target=data.target||data.element;
            $(data.target).removeClass(data.remove_class);
            $(data.target).addClass(data.add_class);
            jsqueue.finished(data.PID);
        },

        /**
         * Set hidden to a given class
         * @param data
         * @constructor
         */
        TOOLS_SET_HIDDEN: function (data) {
            data.target=data.target||data.element;
            $(data.target).addClass('hidden');
            jsqueue.finished(data.PID);
        },

        /**
         * Remove hidden from a given class
         * @param data
         * @constructor
         */
        TOOLS_REMOVE_HIDDEN: function (data) {
            data.target=data.target||data.element;
            $(data.target).removeClass('hidden');
            jsqueue.finished(data.PID);
        },

        /**
         * Remove class from a given target
         * @param data
         * @constructor
         */
        TOOLS_REMOVE_CLASS: function (data) {
            $(data.target).removeClass(data['class']);
            jsqueue.finished(data.PID);
        },

        /**
         * add class from a given target
         * @param data
         * @constructor
         */
        TOOLS_ADD_CLASS: function (data) {
            $(data.target).addClass(data['class']);
            jsqueue.finished(data.PID);
        },

        TOOLS_RUN_NAMED_QUEUE: function (data) {
            jsqueue.namedToQueue(data.namedQueue);
            jsqueue.finished(data.PID);
        },


        /**
         * If help class is found, add it as a popover
         * @param data
         * @constructor
         */
        TOOLS_FIND_HELP: function (data) {
            $('.helper').each(function() {
                var $this = $(this);
                var element_data=$this.data();

                $this.popover({
                    trigger: 'click',
                    placement: 'right',
                    html: true,
                    title: element_data.title,
                    content: function() {
                        if (element_data.templateDisplay) {
                            return $(element_data.templateDisplay).html();
                        } else {
                            return element_data.helptext;
                        }
                    }
                }).click(function(e){
                    e.preventDefault();
                    jsqueue.add(
                        {
                            "component":"WORKFLOW",
                            "command":"WORKFLOW_START"
                        }
                    );
                });
            });

            jsqueue.finished(data.PID);
        },

        /**
         * Display a
         * @param data
         * @constructor
         */
        TOOLS_DISPLAY_TEMPLATE: function (data) {
            data.target=data.target||data.element;
            if(($(data.target).length) <= 0) {
                console.warn("Element does not exist:"+data.target);
            }
            if(($(data.template).length) <= 0) {
                console.warn("Template does not exist"+data.template);
            }
            $(data.target).html($(data.template).render(data));
            jsqueue.finished(data.PID);
        },

        /**
         *  Takes a template and renders the data to data.body on the stack
         * @param data
         * @constructor
         */
        TOOLS_RENDER_TEMPLATE: function (data) {
            var rdata = {};
            rdata.body = $(data.template).render(data);
            jsqueue.push(data.PID, rdata);
            jsqueue.finished(data.PID);
        },

        /**
         *  Takes a template and renders the data to data.body on the stack
         * @param data
         * @constructor
         */
        TOOLS_WF_TEMPLATE: function (data) {
            console.log("TOOLS_WF_TEMPLATE should now be accessed from TEMPLATES/WF_TEMPLATE");
            jsqueue.push_name('TEMPLATE',data);
            if ($(data.template).length > 0) {
                $(data.target).html(core.data.htmlinject($(data.template).html()));
                if(data['class']) {
                    $(data.target).addClass(data['class'])
                }
            } else {
                console.info('Warning template [' + data.template + '] not found');
            }
            jsqueue.finished(data.PID);
        },

        /**
         * Runs a JavaScript function that's defined in data.afunction
         *
         * @example
         *     jsqueue.add({
         *        'component': 'TOOLS',
         *        'command': 'TOOLS_RUN_FUNCTION',
         *        'data': {
         *            //The function that you want to run.
         *            'afunction': 'updatePage'
         *        }
         *    });
         *
         * @param {Object[]} data - The data that you want to send.
         * @param {string} data[].afunction - The function that you want to run.
         * @param {Object} data[].parameters - Optional parameters for the function.
         * @param {boolean} data[].debug - Log out data for debugging.
         * @constructor
         */
        TOOLS_RUN_FUNCTION: function(data) {
            if (data.debug) {
                console.log(data);
            }

            if (data.parameters) {
                window[data.afunction](data.parameters);
            }
            else {
                window[data.afunction]();
            }

            jsqueue.finished(data.PID);
        },

        /**
         *  Bind events to triggers from a json structure
         * @param data
         * @constructor
         */
        TOOLS_ADD_EVENTS: function (data) {
            for (var i = 0; i < data.triggers.length; i++) {
                /**
                 *  Unbind the event first to prevent the old double click if
                 *  we happen to have to re-run
                 */
                $(data.triggers[i].aclass).unbind(data.triggers[i].atrigger);
                if(typeof data.triggers[i].afunction=="string")
                    $(data.triggers[i].aclass).on(data.triggers[i].atrigger,window[data.triggers[i].afunction]);
                else
                    $(data.triggers[i].aclass).on(data.triggers[i].atrigger,data.triggers[i].afunction);
            }
            if (data.global)
                data.global();
            jsqueue.finished(data.PID);
        },

        helper_replace_value: function (key, val, data, to) {
            var self = this;
            if (val instanceof Object) {
                $.each(val, function (mkey, mval) {
                    self.helper_replace_value(mkey, mval, data, to[key])
                });
            } else {
                var matches;
                if (typeof val == "string" && (matches = val.match(/%(.*?)%/))) {
                    console.info('TOOLS_REST_API call is using depricated helper_replace_value % value. Please move to !data: format');

                    /**
                     * Warning voodoo
                     *
                     * This is basically a split of . and not ..
                     *
                    **/
                    var path = matches[1].match(/[^\.]+(?:\.\.[^\.]+)*/g);
                    var obj = data;

                    for (var i = 0; i < path.length; i++) {
                        path[i]=path[i].replace(/\.\./,'.')
                        if (!obj[path[i]]) {
                            obj[path[i]] = {};
                        }
                        if (path.length != (i + 1))
                            obj = obj[path[i]];
                        else {
                            // Set the value
                            // If its an object the regex replace will break the object so we overwrite
                            // but there is no case where you would drop in an object mid replace
                            if(typeof obj[path[i]] == 'object')
                                to[key] = obj[path[i]];
                            else
                                to[key] =to[key].replace(/%.*?%/, obj[path[i]]);
                            break;
                        }
                    }
                } else if (typeof val == "string" && (matches = val.match(/^(#.*?)/))) {
                    console.info('TOOLS_REST_API call is using depricated helper_replace_value # value. Please move to !jquery: format');
                    if(val.match(/^(#.*?)\&array/)) {
                        var matches = val.match(/^(#.*?)\&array/);
                        to[key] = [jQuery(matches[1]).val()];
                    }
                    else {
                        var matches = val.match(/^(#\..*?)/);
                        if(matches) val = val.substr(1);
                        to[key] = jQuery(val).val();
                    }
                }
            }

        },

        /**
         * Disable a button by giving it the disabled attribute. Optionally change the text and class as well as displaying a loading animation.
         * @param data
         * @constructor
         */
        TOOLS_DISABLE_BUTTON: function (data) {
            var self = this;

            if (data.button) {
                if (data.text) {
                    $(data.button).attr('data-oldtext', $(data.button).text());
                    $(data.button).text(data.text);
                }

                if (data.aclass) {
                    $(data.button).attr('data-oldclass', $(data.button).attr('class'));
                    $(data.button).removeClass($(data.button).attr('class'));
                    $(data.button).addClass(data.aclass);
                }

                if (data.displayLoadAnimation == true) {
                    $(data.button).append("<span class='glyphicon glyphicon-refresh spinning'></span>");
                }

                $(data.button).prop('disabled', true);
            }

            if (data.buttons) {
                for (var i = 0; i < data.buttons.length; i++) {
                    $(data.buttons[i]).prop('disabled', true);
                }
            }

            jsqueue.finished(data.PID);
        },

        /**
         * Enable a button by removing the disabled attribute. Optionally change the text and class as well as reverting the text back to what it was before.
         * @param data
         * @constructor
         */
        TOOLS_ENABLE_BUTTON: function (data) {
            var self = this;

            if (data.button) {
                $(data.button).prop('disabled', false);

                if (data.text) {
                    $(data.button).text(data.text);
                }

                if (data.revert) {
                    if (data.revert == true) {
                        $(data.button).text($(data.button).attr('data-oldtext'));
                    }
                }

                if ($(data.button).attr('data-oldclass')) {
                    $(data.button).removeClass($(data.button).attr('class'));
                    $(data.button).addClass($(data.button).attr('data-oldclass'));
                }
            }

            if (data.buttons) {
                for (var i = 0; i < data.buttons.length; i++) {
                    $(data.buttons[i]).prop('disabled', false);
                }
            }

            jsqueue.finished(data.PID);
        },

        /**
         * Change the text of a button.
         * @param data
         * @constructor
         */
        TOOLS_CHANGE_BUTTON_TEXT: function (data) {
            var self = this;

            $(data.button).text(data.text);

            jsqueue.finished(data.PID);
        },

        /**
         * Change the class of a button to change the colour.
         * @param data
         * @constructor
         */
        TOOLS_CHANGE_BUTTON_COLOUR: function (data) {
            var self = this;

            if (data.button && data.toAdd && data.toRemove) {
                $(data.button).addClass(data.toAdd).removeClass(data.toRemove);
            }

            jsqueue.finished(data.PID);
        },

        /**
         * Display a loading animation to signify that a process is happening.
         * @param data
         * @constructor
         */
        TOOLS_DISPLAY_LOAD_ANIMATION: function (data) {
            if (data.element) {
                $(data.element).append("<span class='glyphicon glyphicon-refresh spinning'></span>");
            }

            jsqueue.finished(data.PID);
        },

        /**
         * Schedule a JSQueue action to happen after a delay in seconds.
         * @param data
         * @constructor
         */
        TOOLS_DELAY_ACTION: function (data) {
            if (data.component && data.command && data.data && data.delay) {
               window.setTimeout(
                   function() {
                       if (data.chain) {
                           jsqueue.add(
                               {
                                   'component': data.component,
                                   'command': data.command,
                                   'data': data.data,
                                   'chain': data.chain
                               }
                           );
                       }
                       else {
                           jsqueue.add(
                               {
                                   'component': data.component,
                                   'command': data.command,
                                   'data': data.data
                               }
                           );
                       }
                   }, data.delay);
            }

            jsqueue.finished(data.PID);
        },

        TOOLS_SCHEDULE_ACTION: function (data) {
            if (data.chain) {
                jsqueue.add(
                    {
                        'component': data.component,
                        'command': data.command,
                        'data': data.data,
                        'chain': data.chain
                    });
            }
            else {
                jsqueue.add(
                    {
                        'component': data.component,
                        'command': data.command,
                        'data': data.data
                    });
            }

            setInterval(
                function () {
                    if (data.chain) {
                        jsqueue.add(
                            {
                                'component': data.component,
                                'command': data.command,
                                'data': data.data,
                                'chain': data.chain
                            });
                    }
                    else {
                        jsqueue.add(
                            {
                                'component': data.component,
                                'command': data.command,
                                'data': data.data
                            });
                    }
                }
            , 10000);

            jsqueue.finished(data.PID);
        },

        TOOLS_REDIRECT: function(data) {
            var self=this;
            if (data) {
                $.each(data, function(key, val) {
                    self.helper_replace_value(key, val, data,data);
                });
            }
            window.top.location=data.location;
            jsqueue.finished(data.PID);
        },

        TOOLS_ANIMSCROLL: function(data) {
            switch (data.direction) {
                default:
                case "left": {
                    $(data.element).animate({
                        scrollLeft: data.offset
                    }, data.duration || 400);

                    break;
                }

                case "right": {
                    $(data.element).animate({
                        scrollRight: data.offset
                    }, data.duration || 400);

                    break;
                }

                case "top": {
                    $(data.element).animate({
                        scrollTop: data.offset
                    }, data.duration || 400);

                    break;
                }

                case "bottom": {
                    $(data.element).animate({
                        scrollRight: data.offset
                    }, data.duration || 400);

                    break;
                }
            }

            jsqueue.finished(data.PID);
        },

        TOOLS_JS_SCROLL: function(data) {
            $(data.element).each(function(){
                $(this).height($(window).height());
            });

            jsqueue.finished(data.PID);
        },

        /**
         * Display a progress bar in a given element.
         * @param data
         * @constructor
         */
        TOOLS_PROGRESS_DISPLAY: function (data) {
            if (data.element && data.name) {
                $(data.element).html('<div class="progress progress-striped active"><div class="progress-bar progress-bar-danger" id="' + data.name + '" style="width: 0%;"></div></div>');
            }

            jsqueue.finished(data.PID);
        },

        /**
         * Change the progress of a progress bar by changing it's percentage width.
         * @param data
         * @constructor
         */
        TOOLS_PROGRESS_UPDATE: function (data) {
            if (data.element && data.progress) {
                $(data.element).css("width", data.progress + "%");
            }

            jsqueue.finished(data.PID);
        },

        TOOLS_RUN_JAVASCRIPT: function (data) {
            eval(data['function']+"("+data.args+");");
        },

        TOOLS_PUSH_NAME: function (data) {
            jsqueue.push_name(data.stackname, data.data);
            jsqueue.finished(data.PID);
        },

        TOOLS_MERGE_NAME: function (data) {
            jsqueue.merge_name(data.stackname, data.data);
            jsqueue.finished(data.PID);
        },
        TOOLS_SET_NAME_VALUE: function (data) {
            jsqueue.set_name_value(data.stackname, data.path,data.value);
            jsqueue.finished(data.PID);
        },
        TOOLS_DELETE_NAME_ELEMENT: function (data) {
            jsqueue.delete_name_element(data.stackname, data.element);
            jsqueue.finished(data.PID);
        },

        TOOLS_DELETE_NAME_ARRAY_ITEM: function (data) {
            jsqueue.delete_name_array_element(data.stackname, data.path,data.index);
            jsqueue.finished(data.PID);
        },

        TOOLS_ADD_NAME_ARRAY_ITEM: function (data) {
            jsqueue.add_name_array_element(data.stackname, data.path,data.value,data.unique);
            jsqueue.finished(data.PID);
        },

        TOOLS_URI_TO_NAMED: function(data) {
            var ret=core.data.uritodata(data.statement);
            jsqueue.push_name(data.stackname, ret);
            jsqueue.finished(data.PID);

        },

        TOOLS_CALL_GA: function(data) {
            ga(data.action,data.name,data.url);
            ga('send','pageview');
            jsqueue.finished(data.PID);

        },

        TOOLS_REST_API: function (data) {
            var self = this;
            var senddata = {};
            var ldata=$.extend(true,{},data);
            if (!ldata.uri)
                ldata.uri = self.options.uri;

            if (ldata.form) {
                if (ldata.validatefunction) {
                    if (!window[ldata['validatefunction']](ldata.form)) {
                        return;
                    }
                }
                core.forms.encode(ldata.form,senddata);
            }


            if (ldata.json) {
                $.each(data.json, function(key, val) {
                    self.helper_replace_value(key, val, ldata,ldata.json);
                });
            }


            senddata = $.extend(true,{},ldata.json, senddata);
            senddata = encodeURIComponent(JSON.stringify(senddata));

            /**
             *  IE8/9 CORS support is broken so we can't use it.
             */
            if (navigator.appVersion.indexOf("MSIE 9") != -1 || navigator.appVersion.indexOf("MSIE 8") != -1) {
                $.ajax({
                    type: 'POST',
                    url: ldata.uri,
                    data: senddata,
                    async: true,
                    processData: false,
                    traditional: false,
                    headers: data.headers || {},
                    success: function (rdata) {
                        if(!data.nostack) {
                            if (ldata.json && ldata.json.ignoredata) {
                                jsqueue.push(ldata.PID, rdata.data);
                            } else {
                                jsqueue.push(ldata.PID, rdata);
                            }
                        }
                        jsqueue.finished(ldata.PID);
                        if (self.debug) {
                            console.info('jsTools->call_api');
                            console.info(rdata);
                        }
                        if(ldata.success)
                            ldata.success(rdata);

                    },
                    error: function (rdata) {
                        if (self.debug) {
                            console.warn('jsTools->call_api');
                            console.warn(rdata);
                        }

                    }
                });
            } else {
                $.ajax({
                    type: 'POST',
                    url: ldata.uri,
                    data: senddata,
                    async: true,
                    crossDomain: true,
                    xhrFields: {
                        withCredentials: true
                    },
                    processData: false,
                    traditional: false,
                    headers: data.headers || {},

                    success: function (rdata) {
                        if(!data.nostack) {
                            if (ldata.json && ldata.json.ignoredata) {
                                jsqueue.push(ldata.PID, rdata.data);
                            } else {
                                jsqueue.push(ldata.PID, rdata);
                            }
                        }
                        if (self.debug) {
                            console.info('jsTools->call_api');
                            console.info(rdata);
                        }
                        if(ldata.success)
                            ldata.success(rdata);
                        if(rdata.result=='ERROR') {
                            jsqueue.push_name('API_ERROR_RECV_DATA',rdata);
                            jsqueue.push_name('API_ERROR_SEND_DATA',ldata);
                            jsqueue.namedToQueue('WF_API_ERROR');
                        } else {
                            jsqueue.namedToQueue('WF_API_OK');
                            jsqueue.namedToQueue('WF_NET_OK');
                        }
                        jsqueue.finished(ldata.PID);

                    },
                    error: function (rdata) {
                        if (rdata['readyState'] == 0) {
                            jsqueue.namedToQueue('WF_NET_ERROR');
                            return;
                        }

                        jsqueue.namedToQueue('WF_API_ERROR');

                        if (self.debug) {
                            console.warn('jsTools->call_api');
                            console.warn(rdata);
                        }
                    }
                });
            }
        }
    };


    /* PLUGIN DEFINITION
     * =========================== */
    $.fn.jsTools = function (option) {
        return this.each(function () {
            var $this = $(this), data = $this.data('jsQueueDebug'), options = typeof option == 'object' && option;

            if (!data)
                $this.data('jsTools', (data = new jsTools(this, options)));

            if (typeof option == 'string')
                data[option]();
        })
    }

    $.fn.jsTools.Constructor = jsTools;


}(window.jQuery));

