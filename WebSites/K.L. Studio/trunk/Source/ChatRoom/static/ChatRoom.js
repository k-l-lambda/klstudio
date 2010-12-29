
var chatroom = chatroom || {};

chatroom.WEB_SERVICE_LOCATION = chatroom.WEB_SERVICE_LOCATION || '/tanx-web-service/v1/';

chatroom.WebService = new tanxjs.WebService(chatroom.WEB_SERVICE_LOCATION);
chatroom.ChatRoomApp = chatroom.WebService.getApplication("ChatRoom");

chatroom.SelfUserInfo = chatroom.WebService.getUserInfo();

chatroom.GuestSessions = {}


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
			chatroom.SelfDialogForm.showMessage(message.sender, data.message, Date.parseFormat(message.time, tanxjs.WebService.DateFormat));

			chatroom.SelfSession.postMessage({action: "say", message: data.message, author: message.sender.email}, ["talk"]);

			break;
		default:
			alert("message arrived with unknown action: " + data.action);
		}
	});

	chatroom.SelfDialogForm = new chatroom.DialogForm($("#dialog_form"), chatroom.SelfUserInfo, [chatroom.SelfUserInfo], {PostMessage: function(form, message){
		chatroom.SelfSession.postMessage({action: "say", message: message, author: chatroom.SelfUserInfo.email}, ["talk"], [], function(){
			form.showMessage(chatroom.SelfUserInfo, message, new Date());
		});
	},});
}


chatroom.loadGuestDialogWindow = function(parameters) {
	var id = parameters.id;
	if(!id)
	{
		var lastsessions = chatroom.ChatRoomApp.getSessionList({host: parameters.host}).list;
		if(lastsessions.length)
			id = lastsessions[0].id;
	}
	//alert("id: " + id);

	if(id)
	{
		chatroom.GuestSessions[id] = chatroom.ChatRoomApp.getSession(id);
		chatroom.SelfSession.keepAliveLoop();
		// TODO:
	}
	else
	{
		$("#dialog_form").text("");
		$("#dialog_form").append("<div class='chatroom-dialog-na'>NA</div>");
	}
}
