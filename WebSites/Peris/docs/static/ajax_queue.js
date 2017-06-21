
ajax_queue = function (options)
{
	options = options || {};

	this.pending_requests = 0;
	this.busy_threshold = options.busy_threshold || 3;
	if(options.onIdle)
		this.onIdle = options.onIdle;

	this.busy_interval = options.busy_interval || 1;
	this.idle_interval = options.idle_interval || 1000;

	this.checkIdle();
};

ajax_queue.prototype.onIdle = function () { };
ajax_queue.prototype.in_busy = false;

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

ajax_queue.prototype.busy = function () {
	this.in_busy = true;
};

ajax_queue.prototype.onRequestComplete = function () {
	--this.pending_requests;

	this.triggerIdle();
};

ajax_queue.prototype.triggerIdle = function () {
	if (this.pending_requests < this.busy_threshold)
		this.onIdle(this.busy_threshold - this.pending_requests);
};

ajax_queue.prototype.checkIdle = function () {
	this.triggerIdle();

	var self = this;
	setTimeout(function () {
		self.checkIdle();
	}, (this.pending_requests || this.in_busy) > 0 ? this.busy_interval : this.idle_interval);

	this.in_busy = false;
};
