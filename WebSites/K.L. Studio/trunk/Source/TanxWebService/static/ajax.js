
var TWS_getUserInfo = function() {
	$.ajax({
		url: 'http://localhost:8080/tanx-web-service/v1/user-info',
		dataType: 'json',
		error: function(xhr, textStatus) {
		alert('error: ' + xhr.getAllResponseHeaders());
		},
		success: function(data, textStatus) {
		alert('success: ' + data.nickname);
		},
		/*complete: function(xhr, textStatus) {
			alert(xhr.responseText);
		}*/
	});
}
