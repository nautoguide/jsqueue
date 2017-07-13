/**
 *  jsqueue-tools.js (c) 2014 richard@nautoguide.com
 */

(function ($) {

    "use strict";

    function jsJquery(element, options) {
        var self = this;
        self.options = options;
        self.div = element;

        // Commands
        $(element).on({
            "command": function (event, cmd, data) {
                self[cmd](data);
            }
        });

        jsqueue.activate('JQUERY');
    }


    jsJquery.prototype = {
        constructor: jsJquery,

        /**
         * Display the modal
         * @param data
         * @constructor
         */
        TFA: function (data) {
            if (data.debug) {
                console.log("Target: " + data.target);
                console.log("Function: " + data.function);
                console.log("Arguments: " + (data.args || ""));
                console.log("$(" + data.target + ")." + data.function + "(" + (data.args || "") + ");");
            }

            var result;
            var jtarget=$(data.target);
            if(data.dom!==undefined)
                jtarget=$(data.target).get(0);

            if (data.arg !== undefined) {
                result=jtarget[data.function](data.arg);
            }
            else {
                result=jtarget[data.function].apply($(data.target), data.args);
            }

            jsqueue.push_name("TFA_RESULT", result);

            jsqueue.finished(data.PID);
        }
    };

    /* PLUGIN DEFINITION
     * =========================== */
    $.fn.jsJquery = function (option) {
        return this.each(function () {
            var $this = $(this), data = $this.data('jsQueueDebug'), options = typeof option == 'object' && option;

            if (!data)
                $this.data('jsJquery', (data = new jsJquery(this, options)));

            if (typeof option == 'string')
                data[option]();
        })
    };

    $.fn.jsJquery.Constructor = jsJquery;


}(window.jQuery));

