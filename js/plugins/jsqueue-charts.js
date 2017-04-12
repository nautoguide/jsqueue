/**
 *  jsqueue-charts.js (c) 2016 richard@nautoguide.com
 */

function jsqueue_charts() {

    this.construct = function () {
        var self = this;
        jsqueue.register('CHARTS', 'object');
        jsqueue.activate('CHARTS', self);
    };

    /**
     * Entry point for all charts. Checks for data structure and loads relevant renderer
     *
     * @param data
     * @constructor
     */

    this.CREATE_CHART = function (data) {
        var self = this;

        /**
         *  Check the structure basics
         */
        if (data.chart !== undefined) {
            switch (data.chart.chartType) {
                case 'bar': {
                    this.render_bar(data);
                    break;
                }

                case 'groupBar': {
                    this.render_groupbar(data);
                    break;
                }

                case 'line': {
                    this.render_line(data);
                    break;
                }

                case 'table': {
                    this.render_table(data);
                    break;
                }

                case 'poll': {
                    this.render_poll(data);
                    break;
                }

                default: {
                    console.info('There is no chartType:' + data.chart.chartType);
                }
            }
        } else {
            console.error('jsqueue charts cant find the chart structure');
        }
        jsqueue.finished(data.PID);
    }

    this.wrap = function(text, width) {
        width = 80;

        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);

                tspan.text(line.join(" "));

                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    };

    /**
     *  Make a table using a template
     */

    this.render_table = function(data) {
        $(data.target).html(core.data.htmlinject($(data.template).html()));
    };

    /**
     * Make a D3 bar chart
     * @param chart
     */
    this.render_bar = function(data) {
        // Merge in defaults
        var self=this;

        data.chart.options=$.extend(data.chart.options||{},{
           "xTitle":"",
            "yTitle":"",
            "margin":{"top":100,"bottom":120,"left":80,"right":40},
            "rgb1":"90,167,216",
            "rgb2":"82,181,140",
            "rgbaHover":"204,204,204,0.1",
            "substr":30
        });
        var dataset=[];
        var max=0;
        for(var i=0;i<data.chart.data.length;i++) {
            if(isNaN(parseFloat(data.chart.data[i].rows)))
                data.chart.data[i].rows=0;
            else
                data.chart.data[i].rows=parseFloat(data.chart.data[i].rows);
            dataset.push({"col":parseFloat(data.chart.data[i].rows),"label":data.chart.data[i].title});
            if(data.chart.data[i].rows>max)
                max=data.chart.data[i].rows;
        }
        var w = (data.width||$(data.target).width())-(data.chart.options.margin.right+data.chart.options.margin.left);
        var h = (data.height||$(data.target).height())-(data.chart.options.margin.bottom+data.chart.options.margin.top);
        var customColors=data.chart.color||{};

        var colw=w/dataset.length;

        var sw=w;
        if(colw>100) {
            colw = 100;
            sw=colw*dataset.length;
        }

        /**
         *  Setup the yscale
         */
        var y = d3.scaleLinear()
            .domain([0, max])
            .range([h, 0])
            .nice();

        var yAxis = d3.axisLeft(y);

        /**
         * Xscale
         *
         */

        var x = d3.scaleBand()
            .range([0, sw])
            .padding(0.1);

        x.domain(dataset.map(function(d,i) { return String(d.label).substring(0, data.chart.options.substr); }));
        var xAxis = d3.axisBottom(x);



        var svg = d3.select(data.target)
            .append("svg")
            .attr("width", w+(data.chart.options.margin.right+data.chart.options.margin.left))
            .attr("height", h+(data.chart.options.margin.bottom+data.chart.options.margin.top))
            .append("g")
            .attr("transform", "translate(" + data.chart.options.margin.left + "," + data.chart.options.margin.top + ")");



        var side=svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .attr("transform", "translate(-5)");;


        side.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(data.chart.options.yTitle)
            .attr("transform", "rotate(0) translate(0,-40)");

        var bottom=svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (h+10) + ")")
            .call(xAxis)

        bottom.selectAll("text")
            .call(self.wrap, x.bandwidth());

        bottom.append("text")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(data.chart.options.xTitle);

        var bars = svg.selectAll(".g")
            .data(dataset)
            .enter()
            .append("g")
            .attr("class","bars");



        bars.append("rect")
            .attr("class","vbar vbar1")
            .attr("fill", function(d,i) {if(customColors[i]) return "rgba(0,0,0,0)";return "rgb("+data.chart.options.rgb2+")"; })
            .attr("x", function(d,i) {return (colw*i)+5;})
            .attr("width", colw-5)
            .attr("y", function(d) { return 0; })
            .attr("height", function(d) { return h; });

        bars.append("rect")
            .attr("class","vbar vbar2")
            .attr("fill", function(d,i) {if(customColors[i]) return customColors[i]; return "rgba("+data.chart.options.rgb1+","+(i%dataset.length)/dataset.length+")"; })
            .attr("x", function(d,i) {return (colw*i)+5;})
            .attr("width", colw-5)
            .attr("y", function(d) { return 0; })
            .attr("height", function(d) { return h; })

        bars.append("rect")
            .attr("class","vbarHov")
            .attr("fill", function(d,i) { return "rgba(0,0,0,0)"; })
            .attr("x", function(d,i) {return (colw*i)+5;})
            .attr("width", colw-5)
            .attr("y", function(d) { return 0; })
            .attr("height", function(d) { return h; })
            .on("mouseover", function(d,i) {
                d3.select(this).attr("fill", "rgba("+data.chart.options.rgbaHover+")");
            })
            .on("mouseout", function(d,i) {
                d3.select(this).attr("fill", "rgba(0,0,0,0)");
            });

        bars.on("mouseover", function(d,i) {


            d3.select(this).append("text")
                .attr("class","tt ttt2")

                .text(d.col + (data.chart.options.displayMax ? "/" + max : ""))
                .style("text-anchor", "end")
                .attr("y", 50-(data.chart.options.margin.top))
                .attr("x", w);

            d3.select(this).append("text")
                .attr("class","tt ttt1")
                .text(d.label)
                .style("text-anchor", "end")
                .attr("y", 77-(data.chart.options.margin.top))
                .attr("x", w);

        });

        bars.on("mouseout", function(d,i) {
            d3.select(this).selectAll(".tt")
                .remove();
        });

        side.selectAll("line")
            .attr("class","yline");

        side.selectAll("path")
            .attr("transform","translate(5,0)");

        side.selectAll("text")
            .attr("class","ytext");



        bottom.selectAll("line")
            .attr("class","xline");

        bottom.selectAll("path")
            .attr("transform","translate(0,-5)");

      bottom.selectAll("text")
            .attr("class","xtext")
            .transition()
            .duration(1000)
            .delay(100)
            .attr("transform","translate(-30,60) rotate(-65)");

        bars.selectAll(".vbar")
            .transition()
            .duration(1000)
            .delay(100)
            .attr("y", function(d) {
                return y(d.col);  //Height minus data value
            })
            .attr("height", function(d) {
                return h - y(d.col);
            })
    };

    /**
     * Make a poll chart
     * @param chart
     */
    this.render_poll = function(data) {
        // Merge in defaults
        var self = this;

        data.chart.options = $.extend(data.chart.options || {}, {
            "xTitle": "",
            "yTitle": "",
            "margin": {"top": 100, "bottom": 120, "left": 80, "right": 40},
            "rgb1": "90,167,216",
            "rgb2": "82,181,140",
            "rgbaHover": "204,204,204,0.1",
            "substr": 30
        });

        var dataset = [];
        var max = 0;

        for (var i = 0; i < data.chart.data.length; i++) {
            dataset.push({
                "col": data.chart.data[i].rows,
                "label": data.chart.data[i].title
            });

            if (data.chart.data[i].rows > max) {
                max = data.chart.data[i].rows;
            }
        }

        var w = (data.width || $(data.target).width()) - (data.chart.options.margin.right + data.chart.options.margin.left);
        var h = (data.height || $(data.target).height()) - (data.chart.options.margin.bottom + data.chart.options.margin.top);
        var customColors = data.chart.color || {};

        var colw = w / dataset.length;

        var sw = w;

        if (colw > 100) {
            colw = 100;
            sw = colw * dataset.length;
        }

        /**
         *  Setup the yscale
         */
        var y = d3.scaleLinear()
            .domain([0, max])
            .range([h, 0])
            .nice();

        var yAxis = d3.axisLeft(y);

        /**
         * Xscale
         *
         */
        var x = d3.scaleBand()
            .range([0, sw])
            .padding(0.1);

        x.domain(dataset.map(function(d, i) {
            return String(d.label).substring(0, data.chart.options.substr);
        }));

        var xAxis = d3.axisBottom(x);

        var svg = d3.select(data.target)
            .append("svg")
            .attr("width", w + (data.chart.options.margin.right + data.chart.options.margin.left))
            .attr("height", h + (data.chart.options.margin.bottom + data.chart.options.margin.top))
            .append("g")
            .attr("transform", "translate(" + data.chart.options.margin.left + "," + data.chart.options.margin.top + ")");

        var side = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .attr("transform", "translate(-5)");

        side.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(data.chart.options.yTitle)
            .attr("transform", "rotate(0) translate(0,-40)");

        var bottom = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (h + 10) + ")")
            .call(xAxis);

        bottom.selectAll("text")
            .call(self.wrap, x.bandwidth());

        bottom.append("text")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(data.chart.options.xTitle);

        var bars = svg.selectAll(".g")
            .data(dataset)
            .enter()
            .append("g")
            .attr("class", "bars");

        bars.append("rect")
            .attr("class", "vbar vbar1")
            .attr("fill", function(d, i) {
                if (customColors[i]) {
                    return "rgba(0,0,0,0)";
                }

                return "rgb(" + data.chart.options.rgb2 + ")";
            })
            .attr("x", function(d, i) {
                return (colw * i) + 5;
            })
            .attr("width", colw - 5)
            .attr("y", function(d) {
                return 0;
            })
            .attr("height", function(d) {
                return h;
            });

        bars.append("rect")
            .attr("class", "vbar vbar2")
            .attr("fill", function(d, i) {
                if (customColors[i]) {
                    return customColors[i];
                }

                return "rgba(" + data.chart.options.rgb1 + "," + (i % dataset.length) / dataset.length + ")";
            })
            .attr("x", function(d, i) {
                return (colw * i) + 5;
            })
            .attr("width", colw - 5)
            .attr("y", function(d) {
                return 0;
            })
            .attr("height", function(d) {
                return h;
            });

        bars.append("rect")
            .attr("class", "vbarHov")
            .attr("fill", function(d, i) {
                return "rgba(0,0,0,0)";
            })
            .attr("x", function(d, i) {
                return (colw * i) + 5;
            })
            .attr("width", colw - 5)
            .attr("y", function(d) {
                return 0;
            })
            .attr("height", function(d) {
                return h;
            })
            .on("mouseover", function(d, i) {
                d3.select(this).attr("fill", "rgba(" + data.chart.options.rgbaHover + ")");
            })
            .on("mouseout", function(d, i) {
                d3.select(this).attr("fill", "rgba(0,0,0,0)");
            });

        bars.on("mouseover", function(d, i) {
            d3.select(this).append("text")
                .attr("class", "tt ttt2")
                .text(d.col + (data.chart.options.displayMax ? "/" + max : ""))
                .style("text-anchor", "end")
                .attr("y", 50 - (data.chart.options.margin.top))
                .attr("x", w);

            d3.select(this).append("text")
                .attr("class", "tt ttt1")
                .text(d.label)
                .style("text-anchor", "end")
                .attr("y", 77 - (data.chart.options.margin.top))
                .attr("x", w);
        });

        bars.on("mouseout", function(d, i) {
            d3.select(this).selectAll(".tt").remove();
        });

        side.selectAll("line")
            .attr("class", "yline");

        side.selectAll("path")
            .attr("transform", "translate(5,0)");

        side.selectAll("text")
            .attr("class", "ytext");

        bottom.selectAll("line")
            .attr("class", "xline");

        bottom.selectAll("path")
            .attr("transform", "translate(0,-5)");

        bottom.selectAll("text")
            .attr("class", "xtext")
            .transition()
            .duration(1000)
            .delay(100)
            .attr("transform", "translate(-30,60) rotate(-65)");

        bars.selectAll(".vbar")
            .transition()
            .duration(1000)
            .delay(100)
            .attr("y", function(d) {
                return y(d.col);  //Height minus data value
            })
            .attr("height", function(d) {
                return h - y(d.col);
            })
    };

    /**
     * Make a D3 groupbar chart
     * @param chart
     */
    this.render_groupbar = function(data) {
        var self=this;
        data.chart.options=$.extend(data.chart.options||{},{
            "xTitle":"",
            "yTitle":"",
            "margin":{"top":100,"bottom":100,"left":80,"right":40},
            "rgb1":"90,167,216",
            "rgb2":"82,181,140",
            "rgbaHover":"204,204,204,0.1",
            "substr":30

        });
        var dataset=[];
        var max=0;
        var imax=0;
        var customColors=data.chart.color||{};

        for(var i=0;i<data.chart.data.length;i++) {
            dataset.push({"col":data.chart.data[i].rows,"label":data.chart.data[i].title});
            if(d3.max(data.chart.data[i].rows)>max)
                max=d3.max(data.chart.data[i].rows);
            if(data.chart.data[i].rows.length>imax) {
                imax=data.chart.data[i].rows.length;
            }
        }
        var w = (data.width||$(data.target).width())-(data.chart.options.margin.right+data.chart.options.margin.left);
        var h = (data.height||$(data.target).height())-(data.chart.options.margin.bottom+data.chart.options.margin.top);

        var colw=w/dataset.length;
        var icolw=colw/imax;

        /**
         *  Setup the yscale
         */
        var y = d3.scaleLinear()
            .domain([0, max])
            .range([h, 0])
            .nice();

        var yAxis = d3.axisLeft(y);

        /**
         * Xscale
         *
         */

        var x = d3.scaleBand()
            .range([0, w])
            .padding(0.1);


        x.domain(dataset.map(function(d,i) { return String(d.label).substring(0, data.chart.options.substr); }));
        var xAxis = d3.axisBottom(x);

        var x1 = d3.scaleBand();
        //x1.domain(data.chart.data[0].rows).rangeRoundBands([0, x.rangeBand()]);


        var svg = d3.select(data.target)
            .append("svg")
            .attr("width", w+(data.chart.options.margin.right+data.chart.options.margin.left))
            .attr("height", h+(data.chart.options.margin.bottom+data.chart.options.margin.top))
            .append("g")
            .attr("transform", "translate(" + data.chart.options.margin.left + "," + data.chart.options.margin.top + ")");



        var side=svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .attr("transform", "translate(-5)");;


        side.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(data.chart.options.yTitle)
            .attr("transform", "rotate(0) translate(0,-40)");

        var bottom=svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (h+10) + ")")
            .call(xAxis)

        bottom.selectAll("text")
            .call(self.wrap, x.bandwidth());

        bottom.append("text")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(data.chart.options.xTitle);

        var bars = svg.selectAll(".g")
            .data(dataset)
            .enter()
            .append("g")
            .attr("class","bars")
            .attr("transform", function(d,i) { return "translate(" + (i*colw) + ",0)"; });


        bars.append("rect")
            .attr("class","groupHov")
            .attr("fill", function(d,i) { return "rgba(0,0,0,0)"; })
            .attr("x",0)
            .attr("width", colw)
            .attr("y", function(d) { return 0; })
            .attr("height", function(d) { return h; });




        bars.selectAll("g")
            .data(function(d,i) { return d.col; })
            .enter()
            .append("rect")
            .attr("class","vbar vbar1")
            .attr("fill", function(d,i) {if(customColors[i]) return "rgba(0,0,0,0)"; return "rgb("+data.chart.options.rgb2+")"; })
            .attr("x", function(d,i) {return (icolw*i);})
            .attr("width", icolw)
            .attr("y", function(d) { return 0; })
            .attr("height", function(d) {  return h ; });

        bars.selectAll("g")
            .data(function(d,i) { console.log(d);return d.col; })
            .enter()
            .append("rect")
            .attr("class","vbar vbar2")
            .attr("fill", function(d,i) { if(customColors[i]) return customColors[i]; return "rgba("+data.chart.options.rgb1+","+(i%imax)/imax+")"; })
            .attr("x", function(d,i) {return (icolw*i);})
            .attr("width", icolw)
            .attr("y", function(d) { return 0; })
            .attr("height", function(d) { return h; })

        bars.selectAll("g")
            .data(function(d,i) { return d.col; })
            .enter()
            .append("rect")
            .attr("class","vbarHov")
            .attr("fill", function(d,i) { return "rgba(0,0,0,0)"; })
            .attr("x", function(d,i) {return (icolw*i);})
            .attr("width", icolw)
            .attr("y", function(d) { return 0; })
            .attr("height", function(d) { return h; })
            .on("mouseover", function(d,i) {
                d3.select(this).attr("fill", "rgba("+data.chart.options.rgbaHover+")");
                svg.append("text")
                    .attr("class","tt ttt2")
                    .text(d + (data.chart.options.displayMax ? "/" + max : ""))
                    .style("text-anchor", "end")
                    .attr("y", 50-(data.chart.options.margin.top))
                    .attr("x", w);

                svg.append("text")
                    .attr("class","tt ttt1")
                    .text( data.chart.yLegend[i])
                    .style("text-anchor", "end")
                    .attr("y", 77-(data.chart.options.margin.top))
                    .attr("x", w);

            })
            .on("mouseout", function(d,i) {
                d3.select(this).attr("fill", "rgba(0,0,0,0)");
                svg.selectAll(".tt").remove();

            });



        side.selectAll("line")
            .attr("class","yline");

        side.selectAll("path")
            .attr("transform","translate(5,0)");

        side.selectAll("text")
            .attr("class","ytext");



        bottom.selectAll("line")
            .attr("class","xline");

        bottom.selectAll("path")
            .attr("transform","translate(0,-5)");

        bottom.selectAll("text")
            .attr("class","xtext")
            .transition()
            .duration(1000)
            .delay(100)
            .attr("transform","translate(-30,40) rotate(-65)");

        bars.on("mouseover", function(d,i) {
            d3.select(this).select(".groupHov").attr("fill", "rgba("+data.chart.options.rgbaHover+")");
            svg.append("text")
                .attr("class","tt ttt3")
                .text( d.label)
                .style("text-anchor", "end")
                .attr("y", 100-(data.chart.options.margin.top))
                .attr("x", w);

        }).on("mouseout", function(d,i) {
            d3.select(this).select(".groupHov").attr("fill", "rgba(0,0,0,0)");
                svg.selectAll(".tt")
                    .remove();
            });

        bars.selectAll(".vbar")
            .transition()
            .duration(1000)
            .delay(100)
            .attr("y", function(d) {
                return y(d);  //Height minus data value
            })
            .attr("height", function(d) {
                return h - y(d);
            })
    };

    /**
     * Make a D3 groupbar chart
     * @param chart
     */
    this.render_line = function(data) {
        var self=this;
        data.chart.options=$.extend({
            "xTitle":"",
            "yTitle":"",
            "margin":{"top":100,"bottom":100,"left":80,"right":40},
            "rgbaHover":"204,204,204,0.1",
            "substr":30

        },data.chart.options||{});
        var dataset=[];
        var max=0;
        var imax=0;
        var customColors=data.chart.color||{};
        var parseTime = d3.timeParse("%d-%b-%y");

        for(var i=0;i<data.chart.data.length;i++) {
            dataset.push({"col":data.chart.data[i].rows,"label": data.chart.data[i].title,"rgb": data.chart.data[i].rgb});
            if(d3.max(data.chart.data[i].rows)>max)
                max=d3.max(data.chart.data[i].rows);
            if(data.chart.data[i].rows.length>imax) {
                imax = data.chart.data[i].rows.length;
            }

        }
        var w = (data.width||$(data.target).width())-(data.chart.options.margin.right+data.chart.options.margin.left);
        var h = (data.height||$(data.target).height())-(data.chart.options.margin.bottom+data.chart.options.margin.top);


// set the ranges
        var xd = d3.scaleBand().range([0, w]);
        var x = d3.scaleLinear().range([0, w]);
        var y = d3.scaleLinear().range([h,0]);


        x.domain([0,imax-1]);
        y.domain([0,max]);
        xd.domain(data.chart.xLegend.map(function(d,i) { return String(d); }));

        console.log(x.domain());
        //debugger;
        console.log(x(1));


        var colw=w/dataset.length;
        var icolw=colw/imax;
// define the line

        var lineGen = d3.line()
            .curve(d3.curveBasis)
            .x(function(d,i) {
                return x(i);
            })
            .y(function(d,i) {
                return y(d);
            });

        var lineGenA = d3.line()
            .curve(d3.curveStepAfter)
            .x(function(d,i) {
                return x(i);
            })
            .y(function(d,i) {
                return y(d);
            });

        var svg = d3.select(data.target)
            .append("svg")
            .attr("width", w+(data.chart.options.margin.right+data.chart.options.margin.left))
            .attr("height", h+(data.chart.options.margin.bottom+data.chart.options.margin.top))
            .append("g")
            .attr("transform", "translate(" + data.chart.options.margin.left + "," + data.chart.options.margin.top + ")");

        var lines=svg.selectAll(".g")
            .data(dataset)
            .enter()
            .append("g")
            .attr("class", "line");

        lines.append("path")
            .attr("d", function(d) {return lineGen(d.col)})
            .attr('stroke', function(d) {return "rgba("+d.rgb+",1)"})
            .attr('stroke-width', 4)
            .attr('fill', 'none');

        lines.append("path")
            .attr("d", function(d) {return lineGenA(d.col)})
            .attr('stroke', function(d) {return "rgba("+d.rgb+",0.1)"})
            .attr('stroke-width', 2)
            .attr('fill', 'none');

        lines.append('text')
            .attr("class","text")
            .text(function(d) {return String(d.label);})
            .style("text-anchor", "end")
            .attr('stroke', function(d) {return "rgba("+d.rgb+",1)"})
            .attr("x", w-(data.chart.options.margin.right))
            .attr("y", function(d,i) {return ((i+1)*20)-data.chart.options.margin.top});


        svg.append("g")
            .attr("transform", "translate(0," + h + ")")
            .call(d3.axisBottom(xd));

        // Add the Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));

    };


    this.construct();
}

if(typeof window.jsqueue_plugins==="undefined")
    window.jsqueue_plugins=[];

window.jsqueue_plugins.push('jsqueue_charts');