/**
 *  jsqueue.js (c) 2014 richard@nautoguide.com
 */

function jsqueue_main() {

    this.construct = function () {
        var self = this;
        self.pid = 1;
        /**
         * List of components, this is used to set their state as well
         */
        self.components = {};
        self.debug = false;

        /**
         *  Empty Queue
         * @type {Array}
         */

        self.queue = [];
        self.registers = {};

        self.config = {
            "auto_start": "true",
            "maxlife": 50000,
            "timeout": 10
        };
        self.stack ={};


    };

    this.debugger = function () {
        var self = this;
        console.log('jsqueue debugger enabled');
        self.debug = true;
        return true;
    };
    /**
     * Register new component
     * @param name
     * @param mode
     * @param aclass
     * @param afunction
     */
    this.register = function (name, mode, aclass, afunction) {
        var self = this;
        self.components[name] = {
            'mode': mode || 'plugin',
            'aclass': aclass || '',
            'afunction': afunction || '',
            'state': 'inactive'
        };
    };

    /**
     *  Set a global register
     * @param name
     * @param data
     */
    this.set_reg = function (name, data) {
        var self = this;
        if (typeof data === 'object')
            self.registers[name] = $.extend({}, data);
        else
            self.registers[name] = data;
        if (self.debug) {
            console.info('jsqueue>set_reg:' + name);
            console.info(data);
        }
    };

    /**
     *  Get a global register with option to clear (true)
     * @param name
     * @param mode
     * @returns {*}
     */
    this.get_reg = function (name, mode) {
        var self = this;
        var ret = null;
        mode = mode || false;
        if (typeof self.registers[name] === 'object')
            ret = $.extend({}, self.registers[name]);
        else
            ret = self.registers[name];
        if (mode)
            delete self.registers[name];
        return ret;
    };

    /**
     *  Clear a global register
     * @param name
     */
    this.clear_reg = function (name) {
        var self = this;
        delete self.registers[name];
        if (self.debug)
            console.info('jsqueue>clear_reg:' + name);
    };

    this.killtag = function (tag) {
        var self = this;
        for (var i = 0; i < self.queue.length; i++) {
            if (self.queue[i].tag == tag) {
                self.queue.splice(i, 1);
                console.info('jsqueue>killed tag:' + tag);
                break;
            }
        }
    };
    /**
     *  Cleans any old items in the queue. These will be chained events that have not received a response after being
     *  triggered
     */
    this.clean_queue = function () {
        var self = this;
        var cleaned = 0;
        var iswork = true;
        while (iswork) {
            iswork = false;
            for (var i = 0; i < self.queue.length; i++) {
                if (self.queue[i].state == 'finished') {
                    self.queue.splice(i, 1);
                    iswork = true;
                    break;
                }
                if (jQuery.now() > (self.queue[i].time + self.config.maxlife)) {
                    if (self.debug)
                        console.warn('Cleaned:' + self.queue[i].PID + ':' + self.queue[i].command +':'+self.queue[i].tag);
                    self.queue.splice(i, 1);
                    cleaned++;
                    iswork = true;
                    break;

                }
            }
        }
        if (cleaned > 0) {
            if (self.debug)
                console.info('Cleaned (' + cleaned + ') expired items from queue');
        }
    };

    /**
     *  Start up the components
     */
    this.start_components = function () {
        var self = this;

        /**
         *  Find any with the jsqueue class to add
         */

        jQuery('.jsqueue').each(function (i, ptr) {
            var data = jQuery(this).data();
            self.components[data['jsq_name']] = {
                'mode': 'plugin',
                'aclass': '.' + data['jsq_name'],
                'afunction': data['jsq_plugin'],
                'state': 'inactive'
            };
        });

        /**
         *  Now start them all up
         */
        for (var i in self.components) {
            if (self.components[i].mode == 'plugin') {
                if(jQuery(self.components[i].aclass)[self.components[i].afunction])
                    jQuery(self.components[i].aclass)[self.components[i].afunction](jQuery(self.components[i].aclass).data());
                else
                    console.info('Could not start component '+i);
            }
        }
    };

    /**
     * Add an item to the queue
     * @param data
     */
    this.add = function (data) {
        var self = this;
        var ddata = jQuery.extend({}, data);
        ddata.state = 'queued';
        ddata.time = jQuery.now();
        ddata.logic = true;
        /**
         *  If a queue is tagged we check for an exisiting queue
         *  of the same tag and kill it, tagged queues are unique
         */
        if (ddata.tag)
            self.killtag(ddata.tag);
        else
            ddata.tag = 'untagged';
        if (!ddata.stack)
            ddata.stack = [];
        if (!ddata.data)
            ddata.data = {};
        var qid = self.pid;
        self.queue.push(ddata);
        self.process();
        return qid;

    };
    /**
     *  Run the current queue
     */
    this.process = function (self) {
        var self = this;
        for (var i = 0; i < self.queue.length; i++) {
            if (self.queue[i].component == 'BROADCAST') {
                self.queue[i].state = 'running';
                /**
                 *  In broadcast mode we send the trigger to any active component that will listen
                 *  BROADCAST items can't have chained events so they will just be dumped
                 */
                for (var c = 0; c < self.components.length; c++) {
                    jQuery(self.components[c].aclass).trigger('command', [self.queue[i].command, self.queue[i].data]);
                }
                self.queue[i].state = 'finished';

            } else {
                /**
                 *  Check if the queued item has a matching component that is active and also that the item
                 *  is queued as opposed to running in which case we need to jump over it.
                 */
                if (
                    self.components[self.queue[i].component] &&
                    self.components[self.queue[i].component].state == 'active' &&
                    self.queue[i].state == 'queued' &&
                    ( !self.queue[i].reg || self.registers[self.queue[i].reg])
                ) {
                    /**
                     * Set our state to running and inject a process ID into the data, this is used for chain enabled triggers
                     * to report back they have finished
                     *
                     */
                    self.queue[i].state = 'running';
                    self.queue[i].data.PID = self.pid;

                    var myqueue = self.queue[i];
                    self.pid++;
                    var timeout = myqueue.data.timer || self.config.timeout;
                    switch (myqueue.datamode) {
                        case 'stack':
                            myqueue.data = jQuery.extend({}, myqueue.data, myqueue.stack.pop());
                            break;
                        case 'allstack':
                            myqueue.data.stack = myqueue.stack;
                            break;
                        case 'listen':
                            myqueue.data = jQuery.extend({}, myqueue.data, myqueue.stack[myqueue.stack.length - 1]);
                            break;
                    }
                    self.launch_queue_item(myqueue.component, myqueue.command, myqueue.data, timeout);
                    if (myqueue.hasOwnProperty('chain')) {
                        myqueue.state = 'triggered';
                        if (self.debug)
                            console.info('PID(' + myqueue.data.PID + ') Ran chain ' + myqueue.command + ':' + timeout);

                    } else {
                        myqueue.state = 'finished';
                        if (self.debug)
                            console.info('PID(' + myqueue.data.PID + ') Ran command ' + myqueue.command + ':' + timeout);
                    }
                }
            }
        }
        self.clean_queue();
    };
    /**
     *  We use an intermedia function to launch as timeout will use the variable state in a loop
     */
    this.launch_queue_item = function (component, command, data, timeout) {
        var self = this;
        /**
         *  Process that data through our parser
         */
        if(data.munge!='off')
            core.data.datamunge(data);
        if (self.debug)
            console.log(data);
        if (self.components[component].mode != 'object') {
            setTimeout(function () {
                jQuery(self.components[component].aclass).trigger('command', [command, data])
            }, timeout);
        } else {
            var ptrobj = self.components[component].object;
            if (ptrobj[command]) {
                setTimeout(function () {
                    ptrobj[command](data)
                }, timeout);
            } else {
                console.log(component + ':' + command + ' is not a valid object!');
            }
        }
    };

    this.set_by_pid = function (pid, qdata) {
        for (var i = 0; i < self.queue.length; i++) {
            if (self.queue[i].data.PID == pid) {
                self.queue[i] = qdata;
            }
        }
    };

    /**
     *  Add some data to the stack for use by any future functions in the chain
     * @param pid
     */
    this.push = function (pid, data) {
        var self = this;
        for (var i = 0; i < self.queue.length; i++) {
            if (self.queue[i].data.PID == pid && self.queue[i].state == 'triggered') {
                if(self.queue[i].stackname) {
                    self.stack[self.queue[i].stackname]=data;
                    if (self.debug)
                        console.warn('PID(' + pid + ') updated named stack '+self.queue[i].stackname);
                }
                self.queue[i].stack.push(data);
                if (self.debug)
                    console.warn('PID(' + pid + ') updated the stack');
            }
        }
    };

    this.push_name = function(stackname,data) {
        var self=this;
        self.stack[stackname]=data;
    };

    this.logicfail = function (pid) {
        var self = this;
        for (var i = 0; i < self.queue.length; i++) {
            if (self.queue[i].data.PID == pid) {
                self.queue[i].logic = false;
                return;
            }
        }
    }

    this.finished = function (pid) {
        var self = this;

        for (var i = 0; i < self.queue.length; i++) {
            if (self.queue[i].data.PID == pid && self.queue[i].state == 'triggered') {
                /**
                 *  The only reason we would find the PID in the queue is that it has a chain left so we requeue the next item
                 *  in the chain
                 * @type {*}
                 */


                //console.log(self.queue[i]);
                if (self.queue[i].logic) {
                    var newqueue = self.queue[i].chain[0];
                    newqueue.stack = self.queue[i].stack;
                    self.queue[i].chain.splice(0, 1);
                    if (self.queue[i].chain.length > 0) {
                        newqueue.chain = self.queue[i].chain;
                    }
                    if (self.queue[i].fail_chain && self.queue[i].fail_chain.length > 0) {
                        newqueue.fail_chain = self.queue[i].fail_chain;
                    }
                    self.queue[i].state = 'finished';
                    self.add(newqueue);
                    return;
                } else {
                    if (self.queue[i].fail_chain) {
                        var newqueue = self.queue[i].fail_chain[0];
                        newqueue.stack = self.queue[i].stack;
                        self.queue[i].fail_chain.splice(0, 1);
                        if (self.queue[i].fail_chain.length > 0) {
                            newqueue.chain = self.queue[i].fail_chain;
                        }
                        self.add(newqueue);

                    }
                    self.queue[i].state = 'finished';
                    return;
                }
            }
        }
    };

    /**
     * components call this function to declare they are active and ready to receive commands
     *
     *
     * @param component
     */
    this.activate = function (component, object) {
        var self = this;
        self.components[component].state = 'active';
        if (object)
            self.components[component].object = object;
        /**
         *  Force a queue process to send out any commands that are waiting by adding a debug into the queue
         */
        if (self.debug)
            console.warn('Component ' + component + ' Reports Active');

    };

    this.construct();
}

var jsqueue = null;

jQuery(window).load(function () {

    var config = {};
    if (jQuery('#jsqueue').length > 0)
        config = JSON.parse(jQuery('#jsqueue').attr("data-config"));

    jsqueue = new jsqueue_main();
    var self = jsqueue;

    self.config = jQuery.extend(self.config, config);

    if (isNull(self.config.auto_start)) {
        jsqueue.start_components();
    }
    else {
        if (self.config.auto_start == 'true') {
            jsqueue.start_components();
        }
    }

    if (!isNull(window.loadFnc)) {
        window.loadFnc();
    }
});

function isNull(object) {
    return !(typeof object !== 'undefined' && object);
}
