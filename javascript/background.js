var decodedPhrase;

if (localStorage.phrase) {
    decodedPhrase = localStorage.phrase;
    if (localStorage.notRememberPassphrase) {
        document.cookie = 'passphrase=' + CryptoJS.AES.encrypt(phrase, '').toString();
        localStorage.removeItem('encodedPhrase');
    } else {
        localStorage.encodedPhrase = CryptoJS.AES.encrypt(phrase, '').toString();
    }
    localStorage.removeItem('phrase');
} else if (localStorage.encodedPhrase) {
    decodedPhrase = CryptoJS.AES.decrypt(localStorage.encodedPhrase, '').toString(CryptoJS.enc.Utf8);
} else if (localStorage.notRememberPassphrase === 'true') {
    decodedPhrase = CryptoJS.AES.decrypt(document.cookie.split('passphrase=')[1], '').toString(CryptoJS.enc.Utf8);
}

function getQr(tab, left, top, width, height, windowWidth) {
    chrome.tabs.captureVisibleTab(tab.windowId, {format: 'png'}, function (dataUrl) {
        var qr = new Image();
        qr.src = dataUrl;
        qr.onload = function () {
            this.tab = tab;
            var captureCanvas = document.getElementById('__ga_captureCanvas__');
            if (!captureCanvas) {
                captureCanvas = document.createElement('canvas');
                captureCanvas.id = '__ga_captureCanvas__';
                document.body.appendChild(captureCanvas);
            }
            captureCanvas.width = width;
            captureCanvas.height = height;
            captureCanvas.getContext('2d').drawImage(qr, left, top, width, height, 0, 0, width, height);
            var url = captureCanvas.toDataURL();
            qrcode.callback = getTotp.bind(this);
            qrcode.decode(url);
        };
    });
}

function getTotp(text) {
    var id = this.tab.id;
    if (text.indexOf('otpauth://') !== 0) {
        if (text === 'error decoding QR Code') {
            chrome.tabs.sendMessage(id, {action: 'errorqr'});
        } else {
            chrome.tabs.sendMessage(id, {action: 'text', text: text});
        }
    } else {
        var uri = text.split('otpauth://')[1];
        var type = uri.substr(0, 4).toLowerCase();
        uri = uri.substr(5);
        var label = uri.split('?')[0];
        var parameters = uri.split('?')[1];
        if (!label || !parameters) {
            chrome.tabs.sendMessage(id, {action: 'errorqr'});
        } else {
            var account, secret, issuer;
            label = decodeURIComponent(label);
            if (label.indexOf(':') !== -1) {
                issuer = label.split(':')[0];
                account = label.split(':')[1];
            } else {
                account = label;
            }
            parameters = parameters.split('&');
            for (var i = 0; i < parameters.length; i++) {
                var parameter = parameters[i].split('=');
                if (parameter[0].toLowerCase() === 'secret') {
                    secret = parameter[1];
                } else if (parameter[0].toLowerCase() === 'issuer') {
                    issuer = parameter[1];
                } else if (parameter[0].toLowerCase() === 'counter') {
                    counter = Number(parameter[1]);
                    counter = (isNaN(counter) || counter < 0) ? 0 : counter;
                }
            }
            if (!secret) {
                chrome.tabs.sendMessage(id, {action: 'errorqr'});
            } else if (!/^[0-9a-f]+$/.test(secret.toLowerCase()) && !/^[2-7a-z]+=*$/.test(secret.toLowerCase())){
                chrome.tabs.sendMessage(id, {action: 'secretqr', secret: secret});
            } else {
                chrome.storage.sync.get(function (result) {
                    var index = Object.keys(result).length;
                    var addSecret = {};
                    if (decodedPhrase) {
                        addSecret[CryptoJS.MD5(secret)] = {
                            account: account||'',
                            issuer: issuer||'',
                            type: type,
                            secret: CryptoJS.AES.encrypt(secret, decodedPhrase).toString(),
                            index: index,
                            encrypted: true
                        }
                    } else {
                        addSecret[CryptoJS.MD5(secret)] = {
                            account: account||'',
                            issuer: issuer||'',
                            type: type,
                            secret: secret,
                            index: index
                        }
                    }
                    if ('hotp' === type && counter !== undefined) {
                        addSecret[CryptoJS.MD5(secret)].counter = counter;
                    }
                    chrome.storage.sync.set(addSecret, function() {
                        chrome.tabs.sendMessage(id, {action: 'added', account: account});
                    });
                });
            }
        }
    }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'position') {
        getQr(sender.tab, message.info.left, message.info.top, message.info.width, message.info.height, message.info.windowWidth);
    }
});