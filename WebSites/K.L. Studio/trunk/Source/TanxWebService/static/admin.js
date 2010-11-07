
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
