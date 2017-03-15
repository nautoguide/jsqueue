/**
 *  jsqueue-tools.js (c) 2014 richard@nautoguide.com
 */

(function ($) {

    "use strict";

    function jsWorkflow(element, options) {
        var self = this;
        self.options = options;
        self.div = element;
        // Commands
        $(element).on({
            "command": function (event, cmd, data) {
                self[cmd](data);
            }
        });
        jsqueue.activate('WORKFLOW');
        if (self.options.auto == true) {
            self.WORKFLOW_START({});
        }


        /**
         * loader detection
         * @type {HTMLElement}
         */
        var workflow_load = Object.create(HTMLElement.prototype);
        workflow_load.attachedCallback = function () {
            var data = $(this).data();
            var format = {
                "command": {"message": "No command specified"},
                "component": {"message": "No component specified"}
            };
            /*f(!core.data.check_params(format,data)) {
             console.log(this);
             return;
             }*/
            self.ng_workflow_build(this);
            $(this).remove();
            forceRedraw(this);

        };

        var wfl = document.registerElement('wf-load', {
            prototype: workflow_load
        });


        /** checkbox - experimental
         *
         * @type {HTMLElement}
         */


        var workflow_checkbox = Object.create(HTMLElement.prototype);
        workflow_checkbox.attachedCallback = function () {
            var data=$(this).data();
            var statement = core.data.process_statment(data.statement);
            $(this).append($("<input/>",{
                'type':'checkbox',
                'id':data.id,
                'checked':eval(statement),
                'value':data.value
            }));
            $(this).contents().unwrap();
            /** TODO LEAK **/
            if(data.changequeue!==undefined) {
                $('#'+data.id).click(function(){
                    jsqueue.namedToQueue(data.changequeue);
                });
            }
        };

        var wfl = document.registerElement('wf-checkbox', {
            prototype: workflow_checkbox
        });






        /**
         * click/run detection
         * @type {HTMLElement}
         */
        var workflow_event = Object.create(HTMLElement.prototype);

        /**
         *  Because we attach events to these elements we need to clean up
         *  after dom remove to ensure cleanup
         *
         *  This is being called even when not detached!!
         */
      /* workflow_event.detachedCallback = function() {
           console.log(this);
           var events = $(this).attr('data-events') || 'click run';
           $(this).unbind(events);
        };*/

        workflow_event.createdCallback = function () {
            var data = $(this).data();
            var format = {
                "command": {"message": "No command specified"},
                "component": {"message": "No component specified"}
            };
            /*if(!core.data.check_params(format,data)) {
             console.log(this);
             return;
             }*/
            var events = $(this).attr('data-events') || 'click run';
            $(this).unbind(events);
            $(this).on(events, function (e) {
                e.stopPropagation();
                self.ng_workflow_build(this);
                if ($(this).attr('data-return'))
                    return $(this).attr('data-return');
                return false;
            });
        };

        var wfclick = document.registerElement('wf-event', {
            prototype: workflow_event
        });

        /**
         * text replacer element detection
         * @type {HTMLElement}
         */
        var workflow_text = Object.create(HTMLElement.prototype);



        workflow_text.createdCallback = function () {
            var data = $(this).data();
            var format = {
                "source": {"message": "No source specified"}
            };
            if (!core.data.check_params(format, data)) {
                console.log(this);
                return;
            }
            /**
             * Default the format
             */
            if (!data.format)
                data.format = "TXT_ONLY";


            if (data.format.match(/DEBUG/g)) {
                debugger;
            }
            var concat=false;
            if (data.format.match(/CONCAT/g)) {
                concat=true;
            }

            var value = core.data.uritodata(data.source,concat);

            if (data.format.match(/SUBSTR/g)) {
                if(data.length!==undefined) {
                    value=value.substr(0,data.length);
                } else {
                    console.warn("SUBSTR output but no length attr supplied")
                }
            }

            if (data.format.match(/CONSOLE/g)) {
                console.log(value);
            } else {
                if (typeof value === 'object')
                    value = JSON.stringify(value);
                //value=JSON.stringify(value, core.data.serializer);
                if (value !== undefined) {
                    if (data.format.match(/HTML/g)) {
                        $(this).html(value);
                    }
                    else if (data.format.match(/BBCode/g)) {
                        $(this).html(XBBCODE.process({
                            text: value,
                            removeMisalignedTags: false,
                            addInLineBreaks: false
                        })['html']);
                    }
                    else {
                        $(this).text(value);
                    }
                }
                else
                    $(this).text('');
            }

            //if (data.format.match(/TXT_ONLY/g))
            if(value.length==0)
                $(this).remove();
            else
                $(this).contents().unwrap();

        };

        var wftext = document.registerElement('wf-text', {
            prototype: workflow_text
        });

        /**
         * include a template in current template
         * @type {HTMLElement}
         */
        var workflow_template = Object.create(HTMLElement.prototype);
        workflow_template.attachedCallback = function () {
            var data = $(this).data();
            var format = {
                "template": {"message": "No template specified"}
            };
            if (!core.data.check_params(format, data)) {
                console.log(this);
                return;
            }
            jsqueue.push_name('WF-TEMPLATE',data.data);
            if(data.target!==undefined)
                $(data.target).append(core.data.htmlinject($(data.template).html()));
            else
                $(this).append(core.data.htmlinject($(data.template).html()));
            forceRedraw(this);
            //$(this).contents().unwrap();
            $(this).remove();


        };

        var wftemplate = document.registerElement('wf-template', {
            prototype: workflow_template
        });




        /**
         * include template(s) from a file
         * @type {HTMLElement}
         */
        var workflow_include = Object.create(HTMLElement.prototype);
        workflow_include.attachedCallback = function () {
            var data = $(this).data();
            var format = {
                "file": {"message": "No file specified"}
            };
            if (!core.data.check_params(format, data)) {
                console.log(this);
                return;
            }
            var el=this;

            $.ajax({
                url: data.file,
                success: function (result) {
                        $(el).html(result);
                        $(el).contents().unwrap();
                },
                async: false
            });

/*
            $(this).load(data.file, function() {
                $(this).contents().unwrap();
            });
*/

            forceRedraw(this);

        };

        var wfinclude = document.registerElement('wf-include', {
            prototype: workflow_include
        });


        /**
         * if statement
         * @type {HTMLElement}
         */
        var workflow_if = Object.create(HTMLElement.prototype);
        workflow_if.attachedCallback = function () {
            var data = $(this).data();
            var format = {
                "statement": {"message": "No statement specified"},
                "template": {"message": "No template specified"}
            };
            if (!core.data.check_params(format, data)) {
                console.log(this);
                return;
            }
            var mode=data.mode||'string';

            var statement = core.data.process_statment(data.statement,data.mode);


            jsqueue.push_name('WF-IF',data.data);
            var evalResult=eval(statement);
            if (data.debug) {
                console.info(statement);
                console.log(evalResult);
            }
            if (evalResult) {
                $(this).append(core.data.htmlinject($(data.template).html()));
                forceRedraw(this);
                $(this).contents().unwrap();
            } else {
                if(data.elsetemplate) {
                    $(this).append(core.data.htmlinject($(data.elsetemplate).html()));
                    forceRedraw(this);
                    $(this).contents().unwrap();
                } else {
                    $(this).remove();
                }
            }




        };

        var wfif = document.registerElement('wf-if', {
            prototype: workflow_if
        });

        /**
         * switch
         * @type {HTMLElement}
         */
        var workflow_switch = Object.create(HTMLElement.prototype);
        workflow_switch.attachedCallback = function () {
            var data = $(this).data();
            var format = {
                "source": {"message": "No source specified"}
            };
            if (!core.data.check_params(format, data)) {
                console.log(this);
                return;
            }
            var switch_val = core.data.uritodata(data.source);
            var switch_obj = this;
            $('wf-case', switch_obj).each(function () {
                var case_data = $(this).data();
                var case_val = case_data['value'];
                if (case_val == switch_val) {
                    $(switch_obj).html(core.data.htmlinject($(case_data.template).html()));
                    $('wf-default', switch_obj).remove();
                }
                $(this).remove();

            });
            var sdefault = $('wf-default', switch_obj);
            if (sdefault.length > 0) {
                var default_data = sdefault.data();
                $(switch_obj).html(core.data.htmlinject($(default_data.template).html()));
                sdefault.remove();
            }
            forceRedraw(this);

            $(switch_obj).contents().unwrap();


        };

        var wfswitch = document.registerElement('wf-switch', {
            prototype: workflow_switch
        });


        /**
         * For statement
         * @type {HTMLElement}
         */
        var workflow_for = Object.create(HTMLElement.prototype);
        workflow_for.attachedCallback = function () {
            var data = $(this).data();
            var format = {
                "source": {"message": "No source specified"},
                "template": {"message": "No template specified"}
            };
            if (!core.data.check_params(format, data)) {
                console.log(this);
                return;
            }
            var index_var = data.index || 'index';
            var loop_data = core.data.uritodata(data.source);
            var target = data.target || this;

            if ($(target).length <= 0) {
                console.error('Target does not exist:'+data.target);
                return;
            }

            jsqueue.loops[index_var] = 0;
            if (Object.prototype.toString.call(loop_data) === '[object Array]') {
                for (var i = 0; i < loop_data.length; i++) {
                    jsqueue.loops[index_var] = i;
                    if (data.stackname)
                        jsqueue.push_name(data.stackname, loop_data[i]);
                    $(target).append(core.data.htmlinject($(data.template).html()));

                    forceRedraw(target);

                }
            } else if(typeof  loop_data==='object') {
                for (var i in loop_data) {
                    jsqueue.loops[index_var] = i;
                    if (data.stackname)
                        jsqueue.push_name(data.stackname, {"key": i, "value": loop_data[i]});
                    $(target).append(core.data.htmlinject($(data.template).html()));
                    forceRedraw(target);
                }
            }
            if(data.target)
                $(this).remove();
            else
                $(this).contents().unwrap();

        };

        var wffor = document.registerElement('wf-for', {
            prototype: workflow_for
        });


        function forceRedraw(element) {
            document.dispatchEvent(new CustomEvent('readystatechange'));
        }

        /**
         *  Helper functions for uri variables
         *
         *
         */

        function htmlinject(html) {
            var match, ret_str = html;

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
            var re = /\~([a-zA-Z\.]*:\/\/[a-zA-Z_\/\.0-9@\s]*[\:]{0,1})/g;
            while (match = re.exec(html)) {
                var rep_match = match[1];
                var uri_match = match[1].replace(/\:$/, '');
                ret_str = ret_str.replace("~" + rep_match, core.data.uritodata(uri_match));
            }

            return ret_str;
        }

        function uritodata(uri) {
            // console.log(uri);
            function index(obj, i) {
                var matches = i.match(/^@(.*)/)
                if (matches) {
                    return matches[1];
                }
                if (obj)
                    return obj[i];
                return '';
            }

            /**
             * Find any [ ] sub uri's
             * @type {RegExp}
             */
            var uris = uri.split(',');
            var ret_uri;
            for (var i = 0; i < uris.length; i++) {
                ret_uri = get_uri(uris[i]);
                if (ret_uri)
                    break;

            }
            return ret_uri;


            function get_uri(uri) {
                var ret_str = uri;
                var re = /\[([a-zA-Z\.]*:\/\/[a-zA-Z_\/\.0-9@\s]*)\]/g;
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
        }


    }


    jsWorkflow.prototype = {
        constructor: jsWorkflow,

        WORKFLOW_START: function (data) {
            var self = this;

            /**
             *  Display warning of duplicate ID's which cause common faults
             */
            if (jsqueue && jsqueue.debug) {
                $('[id]').each(function () {
                    var ids = $('[id="' + this.id + '"]');
                    if (ids.length > 1 && ids[0] == this)
                        console.warn('Multiple IDs #' + this.id);
                });
            }

            data.mobile = data.mobile || false;
            $('.js-workflow-onload,.js-workflow-onrun').each(function () {
                self.ng_workflow_build(this);
            });

            /**
             *  Kill any events to prevent the old double down
             */
            $('.js-workflow').unbind('click');
            $('.js-workflow').unbind('run');


            $('.js-workflow:not([data-events])').on('click run', function (e) {
                console.log('Class method js-workflow is now deprecated, convert to wf-event model');
                console.log(this);
                e.stopPropagation();
                self.ng_workflow_build(this);
                if ($(this).attr('data-return'))
                    return $(this).attr('data-return');
                return false;
            });


            $('.js-workflow[data-events]').each(function () {
                console.log('Class method js-workflow is now deprecated, convert to wf-event model');
                console.log(this);

                $(this).on($(this).attr('data-events'), function (e) {
                    e.stopPropagation();
                    self.ng_workflow_build(this);
                    if ($(this).attr('data-return'))
                        return $(this).attr('data-return');
                    return false;
                });
            });

            $('.js-workflow[data-enter]').each(function () {
                var parent_object = this;
                var identifier = $(this).attr('data-enter');
                $(identifier).on('keypress', function (e) {
                    if (e && e.keyCode == 13) {
                        self.ng_workflow_build(parent_object);
                        return false;
                    }
                });
            });

            jsqueue.finished(data.PID);
        },

        ng_workflow_build: function (obj) {
            var self = this;
            var queue = [];
            var fail_queue = [];
            var main_action = jQuery.extend(true, {}, $(obj).data());
            $(obj).removeClass("js-workflow-onload js-workflow");
            $(obj).attr("data-bound", "true");

            $('.js-workflow-action[data-parent=' + $(obj).attr('id') + '][data-order=pre]').each(function () {
                var sub_action = $(this).data();
                queue.push(self.ng_workflow_exec(sub_action));
            });
            queue.push(self.ng_workflow_exec(main_action));
            $('.js-workflow-action[data-parent=' + $(obj).attr('id') + '][data-order!=pre]').each(function () {
                var sub_action = $(this).data();
                if (sub_action.chain && sub_action.chain == 'fail')
                    fail_queue.push(self.ng_workflow_exec(sub_action));

                else
                    queue.push(self.ng_workflow_exec(sub_action));
            });

            /**
             *  Search for children that have wfc element type
             */
            $('wf-child', obj).each(function () {
                var sub_action = $(this).data();
                if (sub_action.chain && sub_action.chain == 'fail')
                    fail_queue.push(self.ng_workflow_exec(sub_action));
                else
                    queue.push(self.ng_workflow_exec(sub_action));
            });


            /**
             *  Format the queue correctly
             */

            for (var i = 0; i < queue.length; i++) {
                if (queue[i] == null)
                    queue.splice(i, 1);
            }
            var run_queue = queue[0];
            queue.splice(0, 1);
            if (queue.length > 0)
                run_queue.chain = queue;
            if (fail_queue.length > 0)
                run_queue.fail_chain = fail_queue;
            jsqueue.add(run_queue);
        },


        ng_workflow_exec: function (action) {
            var self = this;
            switch (action.action) {
                case 'post-form':
                    return {
                        'component': 'TOOLS',
                        'command': 'TOOLS_REST_API',
                        'data': {
                            'uri': self.options.uri,
                            'form': action.form,
                            'validatefunction': action.validatefunction,
                            'json': action.data
                        },
                        'datamode': action.mode ? action.mode : false
                    };
                case 'queue':
                default:
                    var data = {};
                    if (action.form) {
                        core.forms.encode(action.form, data);
                    } else {
                        data = $.extend({}, action.data, action.merge);
                    }
                    var gen_queue = {
                        'component': action.component,
                        'command': action.command,
                        'data': data,
                        'datamode': action.mode ? action.mode : false,
                        'stackname': action.stackname ? action.stackname : false
                    }
                    if (action.named)
                        gen_queue.named = action.named;
                    if (action.reg)
                        gen_queue.reg = action.reg;
                    return gen_queue;
            }
        }
    };


    /* PLUGIN DEFINITION
     * =========================== */
    $.fn.jsWorkflow = function (option) {
        return this.each(function () {
            var $this = $(this), data = $this.data('jsQueueDebug'), options = typeof option == 'object' && option;

            if (!data)
                $this.data('jsWorkflow', (data = new jsWorkflow(this, options)));

            if (typeof option == 'string')
                data[option]();
        })
    }

    $.fn.jsWorkflow.Constructor = jsWorkflow;


}(window.jQuery));

