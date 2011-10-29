// let's not clobber the global namespace, shall we
function /*class*/ MconfGraphics() {
}

MconfGraphics.core_flot = function() 
{
    $.jsonp({
        'url': 'https://mconf.org/stats/json/?callback=MconfGraphics.onDataReceived',
//        'url': 'http://localhost:1234/stats/?callback=MconfGraphics.onDataReceived',
        'method': 'GET',
    });
};

MconfGraphics.plotSeries = function(series, div)
{
    var formatSeries = function(json_series) {
        var datapoints = json_series.datapoints;
        var result = { 
            "users": {
                label: "Users",
                data: []},
            "audio": {
                label: "Audio streams",
                data: []}, 
            "video": {
                label: "Video streams",
                data: []}, 
            "room": {
                label: "Open rooms",
                data: []}
        };
        for (var idx = 0, end = datapoints.length; idx < end; idx += 1) {
            var timestamp = datapoints[idx].timestamp * 1000;
            var previousIdx = (idx == 0)? 0: idx - 1;
            
            var previousValue = datapoints[previousIdx].value;
            var value = datapoints[idx].value;

            if (value.users_count != previousValue.users_count)
                result.users.data.push([timestamp, previousValue.users_count]);
            result.users.data.push([timestamp, value.users_count]);
            
            if (value.video_count != previousValue.video_count)
                result.video.data.push([timestamp, previousValue.video_count]);	    
            result.video.data.push([timestamp, value.video_count]);

            if (value.audio_count != previousValue.audio_count)
                result.audio.data.push([timestamp, previousValue.audio_count]);
            result.audio.data.push([timestamp, value.audio_count]);

            if (value.room_count != previousValue.room_count)
                result.room.data.push([timestamp, previousValue.room_count]);
            result.room.data.push([timestamp, value.room_count]);
        }

        // hard-code color indices to prevent them from shifting as
        // countries are turned on/off
        result.users.color = 'blue'
        result.video.color = 'green'
        result.audio.color = 'red'
        result.room.color = 'yellow'
        
        return result;
    };
    
    var options = {
    xaxis: {
        mode: 'time',
    },
    shadowsSize: 0
    };

    var formatted_series = formatSeries(series);

    // helper for returning the weekends in a period
    function weekendAreas(axes) {
        var markings = [];
        var d = new Date(axes.xaxis.min);
        // go to the first Saturday
        d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 1) % 7))
        d.setUTCSeconds(0);
        d.setUTCMinutes(0);
        d.setUTCHours(0);
        var i = d.getTime();
        do {
            // when we don't set yaxis, the rectangle automatically
            // extends to infinity upwards and downwards
            markings.push({ xaxis: { from: i, to: i + 2 * 24 * 60 * 60 * 1000 } });
            i += 7 * 24 * 60 * 60 * 1000;
        } while (i < axes.xaxis.max);
 
        return markings;
    }

    // insert checkboxes 
    var choiceContainer = $("#choices");
    $.each(formatted_series, function(key, val) {
        choiceContainer.append('<br/><input type="checkbox" name="' + key +
                               '" checked="checked" id="id' + key + '">' +
                               '<label for="id' + key + '">'
                                + val.label + '</label>');
    });
    choiceContainer.find("input").click(plotAccordingToChoices);

    var plot;
    var overview;
    var data = [];
    var options = {}
    
    function plotAccordingToChoices() {
        data = [];
        
        choiceContainer.find("input:checked").each(function () {
            var key = $(this).attr("name");
            if (key && formatted_series[key])
                data.push(formatted_series[key]);
        });
 
        overview = $.plot($("#overview"), data, {
            series: {
                lines: { shadow: true, lineWidth: 1 },
                shadowSize: 0
            },
            xaxis: {/* ticks: [], */mode: "time" },
            yaxis: { ticks: [], autoscaleMargin: 0.1 },
            selection: { mode: "x" },
            legend: { show: false }
        });
        
        options = {
            xaxis: { mode: "time", tickLength: 5 },
            selection: { mode: "x" },
            grid: { markings: weekendAreas }
        };

        plot = $.plot($("#placeholder"), data, options);
        
        if (data.length > 0) {
            var axes = plot.getAxes();
            updateDetailLabel(axes.xaxis.min, axes.xaxis.max);
        }
    }
    
    function updateDetailLabel(min, max) {
        var from = new Date(min);
        var to = new Date(max);

        var detailsContainer = $("#details");
        detailsContainer.text(from.toUTCString() + ' - ' + to.toUTCString());
    }
    
    plotAccordingToChoices();

    // now connect the two
    $("#placeholder").bind("plotselected", function (event, ranges) {
        // do the zooming
        plot = $.plot($("#placeholder"), data,
                    $.extend(true, {}, options, {
                        xaxis: { min: ranges.xaxis.from, max: ranges.xaxis.to }
                    }));
        updateDetailLabel(ranges.xaxis.from, ranges.xaxis.to);
        
        // don't fire event on the overview to prevent eternal loop
        overview.setSelection(ranges, true);
    });
    
    $("#overview").bind("plotselected", function (event, ranges) {
        plot.setSelection(ranges);
    });
};

MconfGraphics.onDataReceived = function(data) 
{
    var daily = data.daily;
    
    MconfGraphics.plotSeries(daily,$('#placeholder'));
};

MconfGraphics.onErrorReceived = function(object, textStatus) {
    alert(textStatus);
};
