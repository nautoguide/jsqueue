/**
 *  jsqueue-tools.js (c) 2014 richard@nautoguide.com
 */

(function ($) {

    "use strict";

    function jsTime(element, options) {
        var self = this;
        self.options = options;
        self.div = element;

        // Commands
        $(element).on({
            "command": function (event, cmd, data) {
                self[cmd](data);
            }
        });
        self.TIME_INIT();
        jsqueue.activate('TIME');
    }


    jsTime.prototype = {
        constructor: jsTime,

        /**
         * Display the modal
         * @param data
         * @constructor
         */
        TIME_DISPLAY: function(data) {
            var d = new Date();

            $(this.options.element).html(d.toLocaleString('en-GB', {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                timeZoneName: "short"
            }));

            jsqueue.add({
                "component":"TIME",
                "command":"TIME_DISPLAY",
                'data': {
                    "timer": 30000
                }
            });

            jsqueue.finished(data.PID);
        },

        TIME_INIT: function(data) {
            jsqueue.add({
                "component":"TIME",
                "command":"TIME_DISPLAY"
            });
        }
    };

    /* PLUGIN DEFINITION
     * =========================== */
    $.fn.jsTime = function (option) {
        return this.each(function () {
            var $this = $(this), data = $this.data('jsQueueDebug'), options = typeof option == 'object' && option;

            if (!data)
                $this.data('jsTime', (data = new jsTime(this, options)));

            if (typeof option == 'string')
                data[option]();
        })
    }

    $.fn.jsTime.Constructor = jsTime;


}(window.jQuery));

