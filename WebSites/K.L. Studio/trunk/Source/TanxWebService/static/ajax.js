
var tanxjs = tanxjs || {};

tanxjs.WebService = function(root_location)
{
	this.RootLocation = root_location;
	this.Applications = {};

	if(typeof tanxjs.WebService._initialized == "undefined")
	{
		tanxjs.WebService.DateFormat = $.browser.mozilla ? /(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)\.\d*/ : /(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+\.\d{3})\d*/;

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
					}
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

tanxjs.WebService.escapeMessagePost = function(text) {
	return text.replace(/[;&]/g, function(c){ return escape(c); });
};

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
					}
				});
				return result;
			}
		};

		tanxjs.WebApplication.prototype.setupSession = function(callback, error)
		{
			var self = this;

			if(callback)
				$.post(this.RootLocation + "setup-session", function(data){
					self.Sessions[data.id] = new tanxjs.WebSession(root_location + "session/" + data.id + "/", data.id, true);
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
						self.Sessions[data.id] = new tanxjs.WebSession(root_location + "session/" + data.id + "/", data.id, true);
						session = self.Sessions[data.id];
					},
					error: error
				});
				return session;
			}
		};

		tanxjs.WebApplication.prototype.getSession = function(id, hosting)
		{
			if(!this.Sessions[id])
				this.Sessions[id] = new tanxjs.WebSession(root_location + "session/" + id + "/", id, hosting);

			return this.Sessions[id];
		};
	}
}

tanxjs.WebSession = function(root_location, id, hosting) {
	this.RootLocation = root_location;
	this.ID = id;
	this.Channels = {};
	this.Active = true;
	this.Hosting = hosting;
	this.IgnoredMessageIds = [];
	if (this.Hosting) {
		this.GuestConnectionTest = [];
		this.NextGuestConnectionTestId = 0;
	}

	if (typeof tanxjs.WebSession._initialized == "undefined") {
		tanxjs.WebSession.prototype.end = function(callback) {
			if (callback)
				$.post(this.RootLocation + "end", callback, "json");
			else
				$.ajax({
					url: this.RootLocation + "end",
					type: "POST",
					dataType: "json",
					async: false
				});
		};

		tanxjs.WebSession.prototype.keepAlive = function(callback) {
			$.post(this.RootLocation + "keep-alive", callback || function() { }, "json");
		};

		tanxjs.WebSession.prototype.getInfo = function(callback) {
			if (callback)
				$.getJSON(this.RootLocation + "info", callback);
			else {
				var result;
				$.ajax({
					url: this.RootLocation + "info",
					dataType: "json",
					async: false,
					success: function(data) {
						result = data;
					}
				});
				return result;
			}
		};

		tanxjs.WebSession.prototype.setTags = function(tags, callback, error) {
			var str = "";
			if (tags)
				for (var i in tags)
				str += "tag=" + tags[i] + ";";

			$.ajax({
				url: this.RootLocation + "set-tags",
				type: "POST",
				data: str,
				dataType: "json",
				success: callback,
				error: error
			});
		};

		tanxjs.WebSession.prototype.postMessage = function(data, channels, audiences, callback, onretry) {
			var self = this;

			var str = "data=" + tanxjs.WebService.escapeMessagePost($.toJSON(data)) + ";";
			if (channels)
				for (var i in channels)
				str += "channel=" + channels[i] + ";";
			if (audiences)
				for (var i in audiences)
				str += "audience=" + audiences[i] + ";";

			$.ajax({
				url: this.RootLocation + "post-message",
				type: "POST",
				data: str,
				dataType: "json",
				success: callback,
				error: onretry && function() {
					var recall = function() { self.postMessage(data, channels, audiences, callback, onretry); };
					var retry = onretry();
					if (retry == 0)
						recall();
					else if (retry > 0)
						setTimeout(recall, retry * 1000);
				}
			});
		};

		tanxjs.WebSession.prototype.fetchMessage = function(start, callback, err) {
			$.ajax({
				url: this.RootLocation + "fetch-message",
				data: { id: start },
				dataType: "json",
				success: callback,
				error: err
			});
		};

		tanxjs.WebSession.prototype.getChannel = function(id) {
			if (!this.Channels[id])
				this.Channels[id] = new tanxjs.WebSessionChannel(root_location + "channel/" + id + "/", id);

			return this.Channels[id];
		};

		tanxjs.WebSession.prototype.keepAliveLoop = function(interval) {
			interval = interval || 60;
			var self = this;
			setInterval(function() { self.keepAlive(); }, interval * 1000);
		};

		tanxjs.WebSession.prototype.fetchMessageLoop = function(onMessageArrived, options) {
			options = options || {};
			options.interval = options.interval || 4;
			options.deactive_interval = options.deactive_interval || 10;
			var next_id = options.start || 0;
			var self = this;

			var fetch = function() {
				self.fetchMessage(next_id, function(data) {
					if (data.error) {
						if (options.onerror)
							options.onerror(data);
					}
					else {
						if (data.warning && options.onwarn)
							options.onwarn(data);

						next_id = data.next;

						var brk = false;
						$.each(data.messages, function(i, msg) {
							if (!brk && self.IgnoredMessageIds.indexOf(msg.id) < 0) {
								try {
									var mdata = $.evalJSON(msg.data);
									if (!self.Hosting) {
										switch (mdata._tanxjs) {
											case "reset-message-id":
												next_id = mdata.next_id;
												brk = true;

												// ignore this message next time
												self.IgnoredMessageIds.push(msg.id);

												break;
											case "connection-test":
												if (!self.Hosting) {
													self.postMessage({ _tanxjs: "connection-test-response", receiveTime: new Date().getTime(), token: mdata.token });
												}

												break;
											default:
												onMessageArrived(self.ID, msg, mdata);
										}
									}
									else {
										switch (mdata._tanxjs) {
											case "connection-test-response":
												if (self.Hosting) {
													var tester = self.GuestConnectionTest[mdata.token];
													if (tester && msg.sender.email.toLowerCase() == tester.guest.toLowerCase()) {
														if (tester.onTimerHandler)
															clearInterval(tester.onTimerHandler);

														var now = new Date();
														if (tester.onResponse) {
															tester.onResponse({
																full: now - tester.startTime,
																guest: mdata.receiveTime - tester.sendTime,
																post: tester.sendTime - tester.startTime.getTime(),
																fetch: now.getTime() - mdata.receiveTime
															});
														}

														delete self.GuestConnectionTest[mdata.token];
													}
												}

												break;
											default:
												onMessageArrived(self.ID, msg, mdata);
										}
									}
								}
								catch (err) {
									if (options.onMessageProcessError)
										options.onMessageProcessError(err);
									else
										alert("message process error: " + err);
								}
							}
						});

						setTimeout(fetch, (self.Active ? options.interval : options.deactive_interval) * 1000);
					}
				}, function(xhr, textStatus, error) {
					//alert("message fetch error, status: " + textStatus + ", error: " + error);

					setTimeout(fetch, (self.Active ? options.interval : options.deactive_interval) * 1000);
				});
			};
			fetch();
		};

		tanxjs.WebSession.prototype.activate = function() {
			this.Active = true;

			if (this.onresume) {
				var onresume = this.onresume;
				this.onresume = null;
				//alert("onresume()");
				onresume();
			}
		};

		tanxjs.WebSession.prototype.deactivate = function() {
			this.Active = false;
		};

		tanxjs.WebSession.prototype.resetGuestMessageId = function(guest, next_id, callback) {
			if (typeof (guest) === "string")
				guest = [guest];
			this.postMessage({ _tanxjs: "reset-message-id", next_id: next_id }, null, guest, callback);
		};

		tanxjs.WebSession.prototype.testGuestConnection = function(guest, onResponse, onTimer) {
			var tester = {
				guest: guest,
				onResponse: onResponse,
				startTime: new Date()
			};
			tester.stopTimer = function() {
				if (tester.onTimerHandler)
					clearInterval(tester.onTimerHandler);
			};

			this.postMessage({ _tanxjs: "connection-test", token: this.NextGuestConnectionTestId }, null, [guest], function() {
				tester.sendTime = new Date().getTime();

				if (onTimer)
					tester.onTimerHandler = setInterval(onTimer, 1000);
			});

			this.GuestConnectionTest[this.NextGuestConnectionTestId] = tester;
			++this.NextGuestConnectionTestId;

			return tester;
		};
	}
};

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
};


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
	};

	if(/(y+)/.test(format)) {
		format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
	}

	for(var k in o) {
		if(new RegExp("("+ k +")").test(format)) {
			format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
		}
	}
	return format;
};

Date.parseFormat = function(str, format)
{
	var date = new Date();
	date.setTime(Date.parse(str.replace(format, "$1/$2/$3 $4:$5:$6 UTC")));

	return date;
};
