// Frontend configuration file.
// Correct API base for your Node backend running on port 3000.

window.API_BASE = window.API_BASE || (
	window.location.protocol === 'http:' || window.location.protocol === 'https:'
		? window.location.origin
		: 'http://127.0.0.1:3000'
);
