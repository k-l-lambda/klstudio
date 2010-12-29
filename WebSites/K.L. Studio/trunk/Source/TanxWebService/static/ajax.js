
var tanxjs = tanxjs || {};

tanxjs.WebService = function(root_location)
{
	this.RootLocation = root_location;
	this.Applications = {};

	if(typeof tanxjs.WebService._initialized == "undefined")
	{
		this.getUserInfo = function(callback)
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

		this.getApplication = function(id)
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
		this.getSessionList = function(queries, callback)
		{
			$.getJSON(this.RootLocation + "session-list", queries, callback);
		};

		this.setupSession = function(callback)
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

		this.getSession = function(id)
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
		this.end = function(callback)
		{
			$.post(this.RootLocation + "end", callback, "json");
		};

		this.keepAlive = function(callback)
		{
			$.post(this.RootLocation + "keep-alive", callback || function(){}, "json");
		};

		this.getInfo = function(callback)
		{
			$.getJSON(this.RootLocation + "info", callback);
		};

		this.setTags = function(tags, callback)
		{
			$.post(this.RootLocation + "set-tags", {tag: tags || []}, callback, "json");
		};

		this.postMessage = function(data, channels, audiences, callback)
		{
			//$.post(this.RootLocation + "post-message", {data: $.toJSON(data), channel: channels || [], audience: audiences || []}, callback || function(){}, "json");
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

		this.fetchMessage = function(start, callback)
		{
			$.getJSON(this.RootLocation + "fetch-message", {id: start}, callback);
		};

		this.getChannel = function(id)
		{
			if(!this.Channels[id])
				this.Channels[id] = new tanxjs.WebSessionChannel(root_location + "channel/" + id + "/", id);

			return this.Channels[id];
		};

		this.keepAliveLoop = function(interval)
		{
			interval = interval || 60;
			var self = this;
			setInterval(function(){self.keepAlive();}, interval * 1000);
		}

		this.fetchMessageLoop = function(onMessageArrived, interval, start)
		{
			interval = interval || 4;
			var next_id = start || 0;
			var self = this;

			var fetch = function(){
				self.fetchMessage(next_id, function(data){
					next_id = data.next;
					for(var i in data.messages)
						onMessageArrived(self.ID, data.messages[i]);

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
		this.getMembers = function(callback)
		{
			$.getJSON(this.RootLocation + "members", callback);
		};

		this.addMember = function(member, callback)
		{
			$.post(this.RootLocation + "add-member", {member: member}, callback, "json");
		};

		this.removeMember = function(member, callback)
		{
			$.post(this.RootLocation + "remove-member", {member: member}, callback, "json");
		};

		this.clearMembers = function(callback)
		{
			$.post(this.RootLocation + "clear-member", callback, "json");
		};
	}
}
