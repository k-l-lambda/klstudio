
var chatroom = chatroom || {};

chatroom.WEB_SERVICE_LOCATION = chatroom.WEB_SERVICE_LOCATION || '/tanx-web-service/v1/'

chatroom.WebService = new tanxjs.WebService(chatroom.WEB_SERVICE_LOCATION);
chatroom.ChatRoomApp = chatroom.WebService.getApplication("ChatRoom");

chatroom.WebService.getUserInfo(function(info){
	chatroom.SelfUserInfo = info;
});


chatroom.DialogForm = function(form, host, members, callbacks)
{
	this.Form = form;
	this.Members = members || [];
	this.Callbacks = callbacks || {};

	this.refreshMemberList = function()
	{
		var text = "";
		for(var i = 0; i < this.Members.length; ++i)
			text += this.Members[i].nickname;
		this.Form.find(".dialog-form-memberlist-text").text(text);
	}

	this.refreshMemberList();
}


chatroom.loadHostDialogWindow = function() {
	var dialogs_frame = $("#dialogs_frame");
	$.get("dialog-form", function(data){
		dialogs_frame.append(data);

		var dialog_form = dialogs_frame.find(".dialog-form:last");
		dialog_form.find(".dialog-form-title-text").text("My Room");

		chatroom.ChatRoomApp.setupSession(function(session){
			chatroom.SelfSession = session;
			chatroom.SelfSession.keepAliveLoop();
			chatroom.SelfSession.fetchMessageLoop(function(session_id, message){
				alert("session_id: " + session_id + "   message: " + message);
			});
		});

		chatroom.SelfDialogForm = chatroom.DialogForm(dialog_form, chatroom.SelfUserInfo, [chatroom.SelfUserInfo]);
	});
}
