
ajax_queue = function (options)
{
	options = options || {};

	this.pending_requests = 0;
	this.busy_threshold = options.busy_threshold || 3;
	if(options.onIdle)
		this.onIdle = options.onIdle;

};

ajax_queue.prototype.onIdle = function() {};

ajax_queue.prototype.ajax = function (options) {
	++this.pending_requests;

	var self = this;

	options.complete = function () {
		self.onRequestComplete();
	};

	$.ajax(options);
};

ajax_queue.prototype.get = function (url, callback) {
	this.ajax({ url: url, success: callback });
};

ajax_queue.prototype.getJSON = function (url, callback) {
	this.ajax({ url: url, dataType: "json", success: callback });
};

ajax_queue.prototype.post = function (url, data, callback) {
	this.ajax({ type: "POST", url: url, data: data, success: callback });
};

ajax_queue.prototype.onRequestComplete = function () {
	--this.pending_requests;

	this.checkIdle();
};

ajax_queue.prototype.checkIdle = function () {
	if (this.pending_requests < this.busy_threshold)
		this.onIdle(this.busy_threshold - this.pending_requests);

	var self = this;
	setTimeout(function () {
		self.checkIdle();
	}, 10);
};
