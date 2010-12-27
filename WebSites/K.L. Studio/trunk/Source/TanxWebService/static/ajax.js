
var tanxjs = tanxjs || {};

tanxjs.WebService = function(root_location)
{
	this.RootLocation = root_location;
	this.Applications = {};

	this.getUserInfo = function(callback)
	{
		$.getJSON(this.RootLocation + "user-info", callback);
	};

	this.getApplication = function(id)
	{
		if(!this.Applications[id])
			this.Applications[id] = new tanxjs.WebApplication(root_location + "app/" + id + "/", id);

		return this.Applications[id];
	};
}

tanxjs.WebApplication = function(root_location, id)
{
	this.RootLocation = root_location;
	this.ID = id;
	this.Sessions = {};

	this.getSessionList = function(queries, callback)
	{
		$.getJSON(this.RootLocation + "session-list", queries, callback);
	};

	this.setupSession = function(callback)
	{
		var self = this;
		$.post(this.RootLocation + "setup-session", function(data){
			self.Sessions[data.id] = new tanxjs.WebSession(root_location + "session/" + data.id + "/", data.id);
			callback(self.Sessions[data.id]);
		}, "json");
	};

	this.getSession = function(id)
	{
		if(!this.Sessions[id])
			this.Sessions[id] = new tanxjs.WebSession(root_location + "session/" + id + "/", id);

		return this.Sessions[id];
	};
}

tanxjs.WebSession = function(root_location, id)
{
	this.RootLocation = root_location;
	this.ID = id;
	this.Channels = {};

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
		$.post(this.RootLocation + "post-message", {data: $.toJSON(data), channel: channels || [], audience: audiences || []}, callback, "json");
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
		setInterval(function(){
			self.fetchMessage(next_id, function(data){
				next_id = data.next;
				for(var i in data.messages)
					onMessageArrived(self.ID, data.messages[i]);
			});
		}, interval * 1000);
	}
}

tanxjs.WebSessionChannel = function(root_location, id)
{
	this.RootLocation = root_location;
	this.ID = id;

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
