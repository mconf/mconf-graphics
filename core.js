// let's not clobber the global namespace, shall we
function /*class*/ MconfGraphics() {
}

MconfGraphics.core_flot = function() 
{
    $.jsonp({
	'url': 'http://localhost:1234/stats/?callback=MconfGraphics.onDataReceived',
	'method': 'GET',
    });
};

MconfGraphics.plotSeries = function(series, div)
{
    var formatSeries = function(json_series) {
	var datapoints = json_series.datapoints;
	var result = { users: [], audio: [], video: [], room: [] };
	for (var idx = 0, end = datapoints.length; idx < end; idx += 1) {
	    result.users.push([datapoints[idx].timestamp * 1000,
			       datapoints[idx].value.users]);
	    result.video.push([datapoints[idx].timestamp * 1000,
			       datapoints[idx].value.video]);
	    result.audio.push([datapoints[idx].timestamp * 1000,
			       datapoints[idx].value.audio]);
	    result.room.push([datapoints[idx].timestamp * 1000,
			      datapoints[idx].value.room]);
	}

	return result;
    };
    
    var options = {
	xaxis: {
	    mode: 'time',
	},
	shadowsSize: 0
    };

    var formatted_series = formatSeries(series);
			      
    var plot_data = [{ 
	    data: formatted_series.users,
	    color: 'blue',
	    shadowSize: 0,
	    label: 'Users'}, { 
	    data: formatted_series.video,
	    color: 'green',
	    shadowSize: 0,
	    label: 'Video streams'}, { 
	    data: formatted_series.audio,
	    color: 'red',
	    shadowSize: 0,
	    label: 'Audio streams'}, { 
	    data: formatted_series.room,
	    color: 'yellow',
	    shadowSize: 0,
	    label: 'Open rooms'
	}];
    // $("#placeholder")
    $.plot(div, plot_data, options);    
};

MconfGraphics.onDataReceived = function(data) 
{
    var daily = data.daily, weekly = data.weekly, monthly = data.monthly;
    
    MconfGraphics.plotSeries(daily,$('#placeholder_daily'));
    MconfGraphics.plotSeries(weekly,$('#placeholder_weekly'));
    MconfGraphics.plotSeries(monthly,$('#placeholder_monthly'));
};

MconfGraphics.onErrorReceived = function(object, textStatus) {
    alert(textStatus);
};
