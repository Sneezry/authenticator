function getQr(tab, left, top, width, height, windowWidth){
	chrome.tabs.captureVisibleTab(tab.windowId, {format: 'png'}, function(dataUrl){
		var qr = new Image();
		qr.src = dataUrl;
		qr.onload = function(){
			if(windowWidth*2 == qr.width){
				//Retina Display
				left *= 2;
				top *= 2;
				width *= 2;
				height *= 2;
			}
			this.tab = tab;
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
			qrcode.callback = getTotp.bind(this);
			qrcode.decode(url);
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
			chrome.storage.sync.get(function(result){
				var index = Object.keys(result).length;
				var addSecret = {};
				addSecret[secret] = {
					account: account,
					issuer: issuer,
					secret: secret,
					index: index
				}
				chrome.storage.sync.set(addSecret, function(){
					chrome.tabs.sendMessage(id, {action: 'added', account: account});
				});
			});
		}
	}
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
	if(message.action == 'position'){
		getQr(sender.tab, message.info.left, message.info.top, message.info.width, message.info.height, message.info.windowWidth);
	}
});