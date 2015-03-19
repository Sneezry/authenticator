var phrase = '';

function loadScripts( callback ){
	var scripts = [
		'assist/aes.js',
		'assist/md5.js',
		'jsqrcode/grid.js',
		'jsqrcode/version.js',
		'jsqrcode/detector.js',
		'jsqrcode/formatinf.js',
		'jsqrcode/errorlevel.js',
		'jsqrcode/bitmat.js',
		'jsqrcode/datablock.js',
		'jsqrcode/bmparser.js',
		'jsqrcode/datamask.js',
		'jsqrcode/rsdecoder.js',
		'jsqrcode/gf256poly.js',
		'jsqrcode/gf256.js',
		'jsqrcode/decoder.js',
		'jsqrcode/qrcode.js',
		'jsqrcode/findpat.js',
		'jsqrcode/alignpat.js',
		'jsqrcode/databr.js'
	];
	var script;
	var scriptsLoaded = 0;

	for (var i=0; i<scripts.length; i++) {
		var script = document.createElement('script');
		script.src = scripts[i];
		document.head.appendChild(script);

		script.onload = function () {
			scriptsLoaded++;
			if (scriptsLoaded === scripts.length){
				callback();
			}
		};
	}
}

function getQr(tab, left, top, width, height, windowWidth){
	chrome.tabs.captureVisibleTab(tab.windowId, {format: 'png'}, function(dataUrl){
		var qr = new Image();
		qr.src = dataUrl;
		qr.onload = function(){
			var thisQr = this;
			if(windowWidth*2 == qr.width){
				//Retina Display
				left *= 2;
				top *= 2;
				width *= 2;
				height *= 2;
			}
			thisQr.tab = tab;
			var captureCanvas = document.getElementById('__ga_captureCanvas__');
			if(!captureCanvas){
				captureCanvas = document.createElement('canvas')
				captureCanvas.id = '__ga_captureCanvas__';
				document.body.appendChild(captureCanvas);
			}
			captureCanvas.width = width;
			captureCanvas.height = height;
			captureCanvas.getContext('2d').drawImage(qr,left,top,width,height,0,0,width,height);
			var url = captureCanvas.toDataURL();

			loadScripts(function() {
				qrcode.callback = getTotp.bind(thisQr);
				qrcode.decode(url);
			});
		}
	});
}

function getTotp(text){
	var id = this.tab.id;
	if(text.indexOf('otpauth://totp/') != 0){
		if(text == 'error decoding QR Code'){
			chrome.tabs.sendMessage(id, {action: 'errorqr'});
		}
		else{
			chrome.tabs.sendMessage(id, {action: 'text', text: text});
		}
	}
	else{
		var uri = text.split('otpauth://totp/')[1];
		var label = uri.split('?')[0];
		var parameters = uri.split('?')[1];
		if(!label || !parameters){
			chrome.tabs.sendMessage(id, {action: 'errorqr'});
		}
		else{
			var account, secret, issuer;
			label = decodeURIComponent(label);
			if(label.indexOf(':') != -1){
				issuer = label.split(':')[0];
				account = label.split(':')[1];
			}
			else{
				account = label;
			}
			parameters = parameters.split('&');
			for(var i=0; i<parameters.length; i++){
				var parameter = parameters[i].split('=');
				if(parameter[0].toLowerCase() == 'secret'){
					secret = parameter[1];
				}
				else if(parameter[0].toLowerCase() == 'issuer'){
					issuer = parameter[1];
				}
			}
			if(!secret){
				chrome.tabs.sendMessage(id, {action: 'errorqr'});
			}
			else if(!/^[0-9a-f]+$/.test(secret.toLowerCase()) && !/^[2-7a-z]+=*$/.test(secret.toLowerCase())){
				chrome.tabs.sendMessage(id, {action: 'secretqr', secret: secret});
			}
			else{
				chrome.storage.sync.get(function(result){
					var index = Object.keys(result).length;
					var addSecret = {};
					if(localStorage.phrase){
						addSecret[CryptoJS.MD5(secret)] = {
							account: account||'',
							issuer: issuer||'',
							secret: CryptoJS.AES.encrypt(secret, localStorage.phrase).toString(),
							index: index,
							encrypted: true
						}
					}
					else{
						addSecret[CryptoJS.MD5(secret)] = {
							account: account||'',
							issuer: issuer||'',
							secret: secret,
							index: index
						}
					}
					chrome.storage.sync.set(addSecret, function(){
						chrome.tabs.sendMessage(id, {action: 'added', account: account});
					});
				});
			}
		}
	}
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
	if(message.action == 'position'){
		getQr(sender.tab, message.info.left, message.info.top, message.info.width, message.info.height, message.info.windowWidth);
	}
	else if (message.action == 'getPhrase') {
		sendResponse({phrase: phrase});
	}
	else if (message.action == 'setPhrase') {
		phrase = message.phrase;
		sendResponse({saved: true});
	}
});