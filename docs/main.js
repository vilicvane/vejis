window.onload = function () {
	var height;

	window.onresize = resize;
	setInterval(resize, 10);

	function resize() {
		var nHeight = document.body.scrollHeight;
		if (nHeight == height) return;
		height = nHeight;
		var style = document.getElementById('page_wrapper').style;
		style.height = 'auto';
		style.height = height + 'px';
		console.log(document.body.scrollHeight);
	}
};
