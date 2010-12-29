
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


var chatroom = chatroom || {};

chatroom.WEB_SERVICE_LOCATION = chatroom.WEB_SERVICE_LOCATION || '/tanx-web-service/v1/';

chatroom.WebService = new tanxjs.WebService(chatroom.WEB_SERVICE_LOCATION);
chatroom.ChatRoomApp = chatroom.WebService.getApplication("ChatRoom");

chatroom.SelfUserInfo = chatroom.WebService.getUserInfo();


chatroom.DialogForm = function(form, host, members, callbacks)
{
	var self = this;

	this.Form = form;
	this.Members = {};
	if(members)
		$.each(members, function(i, m){self.Members[m.email] = m});
	this.Callbacks = callbacks || {};

	var self = this;

	this.refreshMemberList = function()
	{
		var list = this.Form.find(".dialog-form-memberlist-list");
		list.text("");

		$.each(this.Members, function(i, m){
			list.append("<li>" + m.nickname + "</li>");
		});
	};

	this.Form.keypress(function(event){
		switch(event.keyCode)
		{
		case 13:
			var inputbox = self.Form.find(".dialog-form-inputbox");

			if(inputbox.val().length)
				if(self.Callbacks.PostMessage)
					self.Callbacks.PostMessage(self, inputbox.val());

			inputbox.text("");
			event.preventDefault();

			break;
		}
	});

	this.showMessage = function(author, message, date)
	{
		var text = this.Form.find(".dialog-form-record-text");
		text.append("<dt><span class='author'>" + author.nickname + "</span> says at <span class='date'>" + date.format("yyyy-MM-dd hh:mm:ss") + "</span></dt><dd>" + message + "</dd>");
		text.scrollTop(text.height());
	};

	this.refreshMemberList();
}


chatroom.loadHostDialogWindow = function() {
	// query last host session, reuse it if exist.
	var lastsessions = chatroom.ChatRoomApp.getSessionList({host: chatroom.SelfUserInfo.email}).list;

	chatroom.SelfSession = lastsessions.length ? chatroom.ChatRoomApp.getSession(lastsessions[0].id) : chatroom.ChatRoomApp.setupSession();
	chatroom.SelfSession.keepAliveLoop();
	chatroom.SelfSession.fetchMessageLoop(function(session_id, message){
		var data = $.evalJSON(message.data);
		switch(data.action)
		{
		case "join":
			if(!chatroom.SelfDialogForm.Members[message.sender.email])
			{
				chatroom.SelfSession.getChannel("talk").addMember(message.sender.email);
				chatroom.SelfSession.postMessage({action: "add-member", member: message.sender}, ["talk"]);

				chatroom.SelfDialogForm.Members[message.sender.email] = message.sender;
				chatroom.SelfDialogForm.refreshMemberList();
			}

			break;
		case "say":
			chatroom.SelfDialogForm.showMessage(message.sender, data.message, new Date());

			chatroom.SelfSession.postMessage({action: "say", message: data.message, author: message.sender.email}, ["talk"]);

			break;
		default:
			alert("message arrived with unknown action: " + data.action);
		}
	});

	var dialog_form = $("#dialog_form");
	chatroom.SelfDialogForm = new chatroom.DialogForm(dialog_form, chatroom.SelfUserInfo, [chatroom.SelfUserInfo], {PostMessage: function(form, message){
		chatroom.SelfSession.postMessage({action: "say", message: message, author: chatroom.SelfUserInfo.email}, ["talk"], [], function(){
			form.showMessage(chatroom.SelfUserInfo, message, new Date());
		});
	},});
}
