
var chatroom = chatroom || {};

chatroom.WEB_SERVICE_LOCATION = chatroom.WEB_SERVICE_LOCATION || 'http://localhost:8080/tanx-web-service/v1/'


chatroom.loadHostDialogWindow = function() {
	TWS_getUserInfo();
}
