
var tanxjs = tanxjs || {};

tanxjs.WebService = function(root_location)
{
	this.RootLocation = root_location;
	this.Applications = {};

	if(typeof tanxjs.WebService._initialized == "undefined")
	{
		tanxjs.WebService.DateFormat = /(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+\.\d{3})\d*/;

		tanxjs.WebService.prototype.getUserInfo = function(callback)
		{
			if(callback)
				$.getJSON(this.RootLocation + "user-info", callback);
			else
			{
				var info;
				$.ajax({
					url: this.RootLocation + "user-info",
					dataType: "json",
					async: false,
					success: function(data){
						info = data;
					},
				});
				return info;
			}
		};

		tanxjs.WebService.prototype.getApplication = function(id)
		{
			if(!this.Applications[id])
				this.Applications[id] = new tanxjs.WebApplication(root_location + "app/" + id + "/", id);

			return this.Applications[id];
		};
	}
}

tanxjs.WebApplication = function(root_location, id)
{
	this.RootLocation = root_location;
	this.ID = id;
	this.Sessions = {};

	if(typeof tanxjs.WebApplication._initialized == "undefined")
	{
		tanxjs.WebApplication.prototype.getSessionList = function(queries, callback)
		{
			if(callback)
				$.getJSON(this.RootLocation + "session-list", queries || {}, callback);
			else
			{
				var result;
				$.ajax({
					url: this.RootLocation + "session-list",
					data: queries || {},
					dataType: "json",
					async: false,
					success: function(data){
						result = data;
					},
				});
				return result;
			}
		};

		tanxjs.WebApplication.prototype.setupSession = function(callback)
		{
			var self = this;

			if(callback)
				$.post(this.RootLocation + "setup-session", function(data){
					self.Sessions[data.id] = new tanxjs.WebSession(root_location + "session/" + data.id + "/", data.id);
					callback(self.Sessions[data.id]);
				}, "json");
			else
			{
				var session;
				$.ajax({
					url: this.RootLocation + "setup-session",
					type: "POST",
					dataType: "json",
					async: false,
					success: function(data){
						self.Sessions[data.id] = new tanxjs.WebSession(root_location + "session/" + data.id + "/", data.id);
						session = self.Sessions[data.id];
					},
				});
				return session;
			}
		};

		tanxjs.WebApplication.prototype.getSession = function(id)
		{
			if(!this.Sessions[id])
				this.Sessions[id] = new tanxjs.WebSession(root_location + "session/" + id + "/", id);

			return this.Sessions[id];
		};
	}
}

tanxjs.WebSession = function(root_location, id)
{
	this.RootLocation = root_location;
	this.ID = id;
	this.Channels = {};

	if(typeof tanxjs.WebSession._initialized == "undefined")
	{
		tanxjs.WebSession.prototype.end = function(callback)
		{
			$.post(this.RootLocation + "end", callback, "json");
		};

		tanxjs.WebSession.prototype.keepAlive = function(callback)
		{
			$.post(this.RootLocation + "keep-alive", callback || function(){}, "json");
		};

		tanxjs.WebSession.prototype.getInfo = function(callback)
		{
			if(callback)
				$.getJSON(this.RootLocation + "info", callback);
			else
			{
				var result;
				$.ajax({
					url: this.RootLocation + "info",
					dataType: "json",
					async: false,
					success: function(data){
						result = data;
					},
				});
				return result;
			}
		};

		tanxjs.WebSession.prototype.setTags = function(tags, callback)
		{
			var str = "";
			if(tags)
				for(var i in tags)
					str += "tag=" + tags[i] + ";";

			$.ajax({
				url: this.RootLocation + "set-tags",
				type: "POST",
				data: str,
				dataType: "json",
				success: callback || function(){},
			});
		};

		tanxjs.WebSession.prototype.postMessage = function(data, channels, audiences, callback)
		{
			var str = "data=" + $.toJSON(data)+ ";";
			if(channels)
				for(var i in channels)
					str += "channel=" + channels[i] + ";";
			if(audiences)
				for(var i in audiences)
					str += "audience=" + audiences[i] + ";";

			$.ajax({
				url: this.RootLocation + "post-message",
				type: "POST",
				data: str,
				dataType: "json",
				success: callback || function(){},
			});
		};

		tanxjs.WebSession.prototype.fetchMessage = function(start, callback, err)
		{
			$.ajax({
				url: this.RootLocation + "fetch-message",
				data: {id: start},
				dataType: "json",
				success: callback,
				error: err || function(){},
			});
		};

		tanxjs.WebSession.prototype.getChannel = function(id)
		{
			if(!this.Channels[id])
				this.Channels[id] = new tanxjs.WebSessionChannel(root_location + "channel/" + id + "/", id);

			return this.Channels[id];
		};

		tanxjs.WebSession.prototype.keepAliveLoop = function(interval)
		{
			interval = interval || 60;
			var self = this;
			setInterval(function(){self.keepAlive();}, interval * 1000);
		}

		tanxjs.WebSession.prototype.fetchMessageLoop = function(onMessageArrived, interval, start)
		{
			interval = interval || 4;
			var next_id = start || 0;
			var self = this;

			var fetch = function(){
				self.fetchMessage(next_id, function(data){
					next_id = data.next;
					$.each(data.messages, function(i, msg){
						try
						{
							onMessageArrived(self.ID, msg);
						}
						catch(err)
						{
							alert("message process error: " + err);
						}
					});

					setTimeout(fetch, interval * 1000);
				}, function(xhr, textStatus, error){
					//alert("message fetch error, status: " + textStatus + ", error: " + error);

					setTimeout(fetch, interval * 1000);
				});
			};
			fetch();
		}
	}
}

tanxjs.WebSessionChannel = function(root_location, id)
{
	this.RootLocation = root_location;
	this.ID = id;

	if(typeof tanxjs.WebSessionChannel._initialized == "undefined")
	{
		tanxjs.WebSessionChannel.prototype.getMembers = function(callback)
		{
			$.getJSON(this.RootLocation + "members", callback);
		};

		tanxjs.WebSessionChannel.prototype.addMember = function(member, callback)
		{
			$.post(this.RootLocation + "add-member", {member: member}, callback, "json");
		};

		tanxjs.WebSessionChannel.prototype.removeMember = function(member, callback)
		{
			$.post(this.RootLocation + "remove-member", {member: member}, callback, "json");
		};

		tanxjs.WebSessionChannel.prototype.clearMembers = function(callback)
		{
			$.post(this.RootLocation + "clear-member", callback, "json");
		};
	}
}


// Date extension
Date.prototype.format = function(format){
	/*
	 * eg:format="yyyy-MM-dd hh:mm:ss";
	 */
	var o = {
		"M+" :  this.getMonth()+1,  //month
		"d+" :  this.getDate(),     //day
		"h+" :  this.getHours(),    //hour
		"m+" :  this.getMinutes(),  //minute
		"s+" :  this.getSeconds(), //second
		"q+" :  Math.floor((this.getMonth()+3)/3),  //quarter
		"S"  :  this.getMilliseconds() //millisecond
	}

	if(/(y+)/.test(format)) {
		format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
	}

	for(var k in o) {
		if(new RegExp("("+ k +")").test(format)) {
			format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
		}
	}
	return format;
}

Date.parseFormat = function(str, format)
{
	var date = new Date();
	date.setTime(Date.parse(str.replace(format, "$1/$2/$3 $4:$5:$6 UTC")));

	return date;
}
