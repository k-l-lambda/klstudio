
function confirmEvent(msg) {
	if (!confirm(msg)) {
		window.event.returnValue = false;
	}
}

function checkAll(obj, className) {
	var checkboxs = document.getElementsByTagName('input');
	for (var i = 0; i < checkboxs.length; ++i) {
		if (checkboxs[i].className == className)
			checkboxs[i].checked = obj.checked;
	}
}

function editTags() {
	document.getElementById("tags-viewer").style.setProperty("display", "none");
	document.getElementById("tags-editor").style.setProperty("display", "block");
	var text = document.getElementById("tags-text");
	text.value = text.value.match(/\[(.*)\]/)[1].replace(/[u'\s]/g, '');
}

function loadCachedSessionInfo(app_id) {
	$(".cached-session").each(function(){
		var session = $(this);
		var id = session.find(".session-id").text();
		$.getJSON("../../../app/" + app_id + "/session/" + id + "/" + "info", function(data){
			var info = data.info;
			session.find(".session-host").text(info.host.email);
			session.find(".session-setup_time").text(info.setup_time);
			session.find(".session-alive_time").text(info.alive_time);
			session.find(".session-next_host_message_id").text(info.next_host_message_id);
			session.find(".session-next_guest_message_id").text(info.next_guest_message_id);
			session.find(".session-tags").text("[" + info.tags + "]");
		});
	});
}
