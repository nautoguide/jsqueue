/**
 *  jsqueue-nautoguide.js (c) 2014 richard@nautoguide.com
 */

var res;

(function ($) {

    "use strict";

    function jsNautoguide(element, options) {
        var self = this;
        self.options = options;
        self.div = element;

        // Commands
        $(element).on({
            "command": function (event, cmd, data) {
                self[cmd](data);
            }
        });

        jsqueue.activate('NAUTOGUIDE');

        var url = window.location.protocol + "//" + window.location.hostname;
        var path = window.location.pathname;

        url += path.replace('app', 'api');

        $.ajax({
            type: 'POST',
            url: url,
            processData: false,
            traditional: false,
            data: encodeURIComponent(JSON.stringify({
                    "api": "configuration_api",
                    "action": "token_check"
            })),
            success: function (result) {
                res = result;

                jsNautoguide.prototype.POPULATE_SYSTEM_VARIABLES();
            },
            async: false
        });

        /*jsqueue.add({
            'component': 'TOOLS',
            'command': 'TOOLS_REST_API',
            'stackname': 'TOKEN_DETAIL',
            'data': {
                'json': {
                    'api': 'configuration_api',
                    'action': 'token_check'
                }
            },
            'chain': [
                {
                    'component': 'NAUTOGUIDE',
                    'command': 'POPULATE_SYSTEM_VARIABLES'
                }
            ]
        });*/
    }

    jsNautoguide.prototype = {
        constructor: jsNautoguide,

        POPULATE_SYSTEM_VARIABLES: function() {
            //var stack = jsqueue.get_stack_name("TOKEN_DETAIL");

            window.nautosdk = {"app": {"schema": res['_schema'] || res['data']['_acl'][0]['schema'].replace("ng_", "")}, "acl": res['data']};

            jsqueue.set_reg("NAUTOGUIDE_LOADED", true);
        }
    };

    /* PLUGIN DEFINITION
     * =========================== */
    $.fn.jsNautoguide = function (option) {
        return this.each(function () {
            var $this = $(this), data = $this.data('jsQueueDebug'), options = typeof option == 'object' && option;

            if (!data) {
                $this.data('jsNautoguide', (data = new jsNautoguide(this, options)));
            }

            if (typeof option == 'string') {
                data[option]();
            }
        });
    };

    $.fn.jsNautoguide.Constructor = jsNautoguide;
}(window.jQuery));
