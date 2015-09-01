// Originally based on the JavaScript implementation as provided by Russell Sayers on his Tin Isles blog:
// http://blog.tinisles.com/2011/10/google-authenticator-one-time-password-algorithm-in-javascript/

var KeyUtilities = function() {
	var dec2hex = function(s) {
		return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
	};

	var hex2dec = function(s) {
		return parseInt(s, 16);
	};

	var base32tohex = function(base32) {
		var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
		var bits = "";
		var hex = "";

		for (var i = 0; i < base32.length; i++) {
			var val = base32chars.indexOf(base32.charAt(i).toUpperCase());
			bits += leftpad(val.toString(2), 5, '0');
		}

		for (i = 0; i + 4 <= bits.length; i += 4) {
			var chunk = bits.substr(i, 4);
			hex = hex + parseInt(chunk, 2).toString(16);
		}

		if (hex.length % 2 && hex[hex.length - 1] === '0') {
			hex = hex.substr(0, hex.length - 1);
		}

		return hex;
	};

	var leftpad = function(str, len, pad) {
		if (len + 1 >= str.length) {
			str = new Array(len + 1 - str.length).join(pad) + str;
		}
		return str;
	};

	var generate = function(secret, counter) {
		secret = secret.replace(/\s/g, '');
		var len = 6;
		if(/^[a-z2-7]+=*$/.test(secret.toLowerCase())) {
			var key = base32tohex(secret);
		}
		else if(/^[0-9a-f]+$/.test(secret.toLowerCase())) {
			var key = secret;
		}
		else if(/^bliz\-/.test(secret.toLowerCase())) {
			var key = base32tohex(secret.substr(5));
			len = 8;
		}
		else if(/^blz\-/.test(secret.toLowerCase())) {
			var key = base32tohex(secret.substr(4));
			len = 8;
		}
		if(isNaN(counter)){
			var epoch = Math.round(new Date().getTime() / 1000.0);
			if(localStorage.offset){
				epoch = epoch+Number(localStorage.offset);
			}
			var counter = Math.floor(epoch / 30)
		}
		
		var time = leftpad(dec2hex(counter), 16, '0');

		// external library for SHA functionality
		var hmacObj = new jsSHA(time, "HEX");
		var hmac = hmacObj.getHMAC(key, "HEX", "SHA-1", "HEX");

		var offset;
		if (hmac !== 'KEY MUST BE IN BYTE INCREMENTS') {
			offset = hex2dec(hmac.substring(hmac.length - 1));
		}

		var otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')) + '';
		if(otp.length < len){
			otp = new Array(len - otp.length + 1).join('0') + otp;
		}
		return (otp).substr(otp.length - len, len).toString();
	};

	// exposed functions
	return {
		generate: generate
	};
};