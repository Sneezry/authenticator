var otp = new KeyUtilities();
var getCode = otp.generate;
var _secret = [];
var deleteIdList = [];
var deleteKeyList = [];
var updateInterval;
var dragBox;
var notificationTimeout;
var editTimeout;
var decodedPhrase;
var shownPassphrase = false;
var capturing = false;

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
} else if (document.cookie) {
    decodedPhrase = CryptoJS.AES.decrypt(document.cookie.split('passphrase=')[1], '').toString(CryptoJS.enc.Utf8);
}

document.getElementById('extName').innerText = chrome.i18n.getMessage('extShortName');
document.getElementById('add_qr').innerText = chrome.i18n.getMessage('add_qr');
document.getElementById('add_secret').innerText = chrome.i18n.getMessage('add_secret');
document.getElementById('totp_label').innerText = chrome.i18n.getMessage('based_on_time');
document.getElementById('hotp_label').innerText = chrome.i18n.getMessage('based_on_counter');
document.getElementById('add_button').innerText = chrome.i18n.getMessage('ok');
document.getElementById('message_close').innerText = chrome.i18n.getMessage('ok');
document.getElementById('account_label').innerText = chrome.i18n.getMessage('account');
document.getElementById('secret_label').innerText = chrome.i18n.getMessage('secret');
document.getElementById('menuName').innerText = chrome.i18n.getMessage('settings');
document.getElementById('security_new_phrase_label').innerText = chrome.i18n.getMessage('phrase');
document.getElementById('security_confirm_phrase_label').innerText = chrome.i18n.getMessage('confirm_phrase');
document.getElementById('security_warning').innerText = chrome.i18n.getMessage('security_warning');
document.getElementById('exportButton').innerText = chrome.i18n.getMessage('update');
document.getElementById('resize_save').innerText = chrome.i18n.getMessage('ok');
document.getElementById('security_save').innerText = chrome.i18n.getMessage('ok');
document.getElementById('passphrase_info').innerText = chrome.i18n.getMessage('passphrase_info');
document.getElementById('passphrase_phrase_label').innerText = chrome.i18n.getMessage('passphrase');
document.getElementById('remember_new_phrase_label').innerText = chrome.i18n.getMessage('remember_phrase');
document.getElementById('remember_phrase_label').innerText = chrome.i18n.getMessage('remember_phrase');
document.getElementById('resize_list_label').innerText = chrome.i18n.getMessage('scale');
document.getElementById('passphrase_ok').innerText = chrome.i18n.getMessage('ok');
document.getElementById('version').innerText = 'Version ' + chrome.runtime.getManifest().version;

document.getElementById('menuAbout').innerHTML += chrome.i18n.getMessage('about');
document.getElementById('menuExImport').innerHTML += chrome.i18n.getMessage('export_import');
document.getElementById('menuSecurity').innerHTML += chrome.i18n.getMessage('security');
document.getElementById('menuSyncTime').innerHTML += chrome.i18n.getMessage('sync_clock');
document.getElementById('menuResize').innerHTML += chrome.i18n.getMessage('resize_popup_page');
document.getElementById('menuSource').innerHTML += chrome.i18n.getMessage('source');
document.getElementById('menuFeedback').innerHTML += chrome.i18n.getMessage('feedback');

if (localStorage.notRememberPassphrase === 'true') {
    document.getElementById('remember_new_phrase').checked = false;
    document.getElementById('remember_phrase').checked = false;
}

chrome.storage.sync.get(showCodes);

document.getElementById('menuExImport').onclick = showExport;

document.getElementById('menuAbout').onclick = function () {
    document.getElementById('info').className = 'fadein';
    setTimeout(function () {
        document.getElementById('info').style.opacity = 1;
        document.getElementById('infoContent').innerHTML = chrome.i18n.getMessage('info');
    }, 200);
}

document.getElementById('menuSecurity').onclick = function () {
    document.getElementById('security').className = 'fadein';
    setTimeout(function () {
        document.getElementById('security').style.opacity = 1;
    }, 200);
}

chrome.permissions.contains({
    origins : ['https://www.google.com/']
}, function (hasPermission) {
    if (hasPermission) {
        syncTimeWithGoogle(false);
    }
});

document.getElementById('menuSyncTime').onclick = function () {
    chrome.permissions.request({
        origins : ['https://www.google.com/']
    }, function (granted) {
        if (granted) {
            syncTimeWithGoogle(true);
        }
    });
}

document.getElementById('menuResize').onclick = function () {
    document.getElementById('resize').className = 'fadein';
    setTimeout(function () {
        document.getElementById('resize').style.opacity = 1;
    }, 200);
}

document.getElementById('resize_save').onclick = function () {
    var zoom = document.getElementById('resize_list').value;
    localStorage.zoom = zoom;
    window.close();
}

document.getElementById('security_save').onclick = function () {
    var phrase = document.getElementById('security_new_phrase').value;
    var phrase2 = document.getElementById('security_confirm_phrase').value;
    if (phrase === phrase2) {
        document.getElementById('security_new_phrase').value = '';
        document.getElementById('security_confirm_phrase').value = '';
        localStorage.notRememberPassphrase = (!document.getElementById('remember_new_phrase').checked).toString();
        document.getElementById('remember_phrase').checked = document.getElementById('remember_new_phrase').checked;
        encryptSecret(phrase, true, function () {
            showMessage(chrome.i18n.getMessage('updateSuccess'), function () {
                document.getElementById('security').className = 'fadeout';
                setTimeout(function () {
                    document.getElementById('security').className = '';
                    document.getElementById('security').style.opacity = 0;
                }, 200);
            });
        }, function () {
            showMessage(chrome.i18n.getMessage('phrase_incorrect'));
        });
    } else {
        showMessage(chrome.i18n.getMessage('phrase_not_match'));
    }
}

document.getElementById('phrase').onkeydown = function(e) {
    if (e.keyCode === 13) {
        var phrase = document.getElementById('phrase').value;
        document.getElementById('phrase').value = '';
        localStorage.notRememberPassphrase = (!document.getElementById('remember_phrase').checked).toString();
        document.getElementById('remember_new_phrase').checked = document.getElementById('remember_phrase').checked;
        encryptSecret(phrase, false, function () {
            document.getElementById('passphrase').className = 'fadeout';
            setTimeout(function () {
                document.getElementById('passphrase').className = '';
                document.getElementById('passphrase').style.opacity = 0;
            }, 200);
        }, function () {
            showMessage(chrome.i18n.getMessage('phrase_incorrect'));
        });
    }
}

document.getElementById('passphrase_ok').onclick = function () {
    var phrase = document.getElementById('phrase').value;
    document.getElementById('phrase').value = '';
    localStorage.notRememberPassphrase = (!document.getElementById('remember_phrase').checked).toString();
    document.getElementById('remember_new_phrase').checked = document.getElementById('remember_phrase').checked;
    encryptSecret(phrase, false, function () {
        document.getElementById('passphrase').className = 'fadeout';
        setTimeout(function () {
            document.getElementById('passphrase').className = '';
            document.getElementById('passphrase').style.opacity = 0;
        }, 200);
    }, function () {
        showMessage(chrome.i18n.getMessage('phrase_incorrect'));
    });
}

document.getElementById('securityClose').onclick = function () {
    document.getElementById('security').className = 'fadeout';
    setTimeout(function () {
        document.getElementById('security').className = '';
        document.getElementById('security').style.opacity = 0;
    }, 200);
}

document.getElementById('resizeClose').onclick = function () {
    document.getElementById('resize').className = 'fadeout';
    setTimeout(function () {
        document.getElementById('resize').className = '';
        document.getElementById('resize').style.opacity = 0;
    }, 200);
}

document.getElementById('passphraseClose').onclick = function () {
    document.getElementById('passphrase').className = 'fadeout';
    setTimeout(function () {
        document.getElementById('passphrase').className = '';
        document.getElementById('passphrase').style.opacity = 0;
    }, 200);
}

document.getElementById('infoAction').onclick = function () {
    document.getElementById('menu').className = 'slidein';
    setTimeout(function () {
        document.getElementById('menu').style.opacity = 1;
    }, 200);
}

document.getElementById('menuClose').onclick = function () {
    document.getElementById('menu').className = 'slideout';
    setTimeout(function () {
        document.getElementById('menu').className = '';
        document.getElementById('menu').style.opacity = 0;
    }, 200);
}

document.getElementById('infoClose').onclick = function () {
    document.getElementById('info').className = 'fadeout';
    setTimeout(function () {
        document.getElementById('info').className = '';
        document.getElementById('info').style.opacity = 0;
        document.getElementById('infoContent').innerHTML = '';
    }, 200);
}

document.getElementById('add').onclick = function () {
    document.getElementById('add_qr').style.display = 'block';
    document.getElementById('add_secret').style.display = 'block';
    document.getElementById('secret_box').style.display = 'none';
    document.getElementById('addAccount').className = 'fadein';
    setTimeout(function () {
        document.getElementById('addAccount').style.opacity = 1;
    }, 200);
}

document.getElementById('addAccountClose').onclick = function () {
    document.getElementById('addAccount').className = 'fadeout';
    setTimeout(function () {
        document.getElementById('addAccount').className = '';
        document.getElementById('addAccount').style.opacity = 0;
    }, 200);
}

document.getElementById('add_qr').onclick = function () {
    beginCapture(false);
};

document.getElementById('add_secret').onclick = function () {
    document.getElementById('add_qr').style.display = 'none';
    document.getElementById('add_secret').style.display = 'none';
    document.getElementById('secret_box').style.display = 'block';
}

document.getElementById('exportClose').onclick = function () {
    document.getElementById('export').className = 'fadeout';
    setTimeout(function () {
        document.getElementById('export').className = '';
        document.getElementById('export').style.opacity = 0;
    }, 200);
}

document.getElementById('exportButton').onclick = function () {
    var data = document.getElementById('exportData').value;
    try {
        data = JSON.parse(data);
        chrome.storage.sync.set(data, function () {
            if (decodedPhrase) {
                encryptSecret(decodedPhrase, true);
            }
            chrome.storage.sync.get(showCodes);
            showMessage(chrome.i18n.getMessage('updateSuccess'), function () {
                document.getElementById('export').className = 'fadeout';
                setTimeout(function () {
                    document.getElementById('export').className = '';
                    document.getElementById('export').style.opacity = 0;
                    document.getElementById('exportData').value = '';
                }, 200);
            });
        });
    } catch (e) {
        showMessage(chrome.i18n.getMessage('updateFailure'));
    }
}

document.getElementById('editAction').onmousedown = function () {
    editTimeout = setTimeout(function () {
            beginCapture(true);
        }, 500);
}

document.getElementById('editAction').onclick = editCodes;

document.getElementById('qr').onclick = function () {
    this.className = 'qrfadeout';
    setTimeout(function () {
        document.getElementById('qr').className = '';
        document.getElementById('qr').style.opacity = 0;
    }, 200);
}

document.getElementById('message_close').onclick = function () {
    document.getElementById('message').style.display = 'none';
}

document.getElementById('add_button').onclick = saveSecret;

function showMessage(msg, closeAction) {
    document.getElementById('message_content').innerText = msg;
    document.getElementById('message').style.display = 'block';
    document.getElementById('message_close').onclick = function () {
        document.getElementById('message').style.display = 'none';
        if (closeAction) {
            closeAction();
        }
    }
}

function updateSecret(callback) {
    for (var i = 0; i < _secret.length; i++) {
        if (deleteIdList.indexOf(i) != -1) {
            _secret[i] = null;
        }
    }
    _secret = sortCode();
    chrome.storage.sync.remove(deleteKeyList, function () {
        deleteIdList = [];
        deleteKeyList = [];
        chrome.storage.sync.get(function (secret) {
            var changeSecret = {};
            for (var i = 0; i < _secret.length; i++) {
                if (secret[_secret[i].secret] && (secret[_secret[i].secret].index != _secret[i].index ||
                        secret[_secret[i].secret].account != _secret[i].account ||
                        secret[_secret[i].secret].issuer != _secret[i].issuer) ||
                    secret[CryptoJS.MD5(_secret[i].secret)] && (secret[CryptoJS.MD5(_secret[i].secret)].index != _secret[i].index ||
                        secret[CryptoJS.MD5(_secret[i].secret)].account != _secret[i].account ||
                        secret[CryptoJS.MD5(_secret[i].secret)].issuer != _secret[i].issuer)) {
                    changeSecret[CryptoJS.MD5(_secret[i].secret)] = _secret[i];
                    if (decodedPhrase) {
                        changeSecret[CryptoJS.MD5(_secret[i].secret)].secret = CryptoJS.AES.encrypt(_secret[i].secret, decodedPhrase).toString();
                    }
                }
            }
            if (changeSecret) {
                chrome.storage.sync.set(changeSecret, function () {
                    if (callback) {
                        callback();
                    } else {
                        chrome.storage.sync.get(showCodes);
                        codes.scrollTop = 0;
                    }
                });
            } else {
                if (callback) {
                    callback();
                } else {
                    chrome.storage.sync.get(showCodes);
                    codes.scrollTop = 0;
                }
            }
        });
    });
}

function checkSecret(secret, type) {
    switch (type) {
        case 'base32':
            var base32RegEx =  /[^a-z2-7=]/gi;
            return base32RegEx.test(secret);

        case 'hex':
            var hexRegEx = /[^a-f0-9]/gi;
            return hexRegEx.test(secret);
    }
}

function saveSecret() {
    var account = document.getElementById('account_input').value;
    var secret = document.getElementById('secret_input').value;
    var type = document.getElementById('totp').checked ? 'totp' : 'hotp';
    if (!account || !secret) {
        showMessage(chrome.i18n.getMessage('err_acc_sec'));
        return;
    }
    var battleRegEx = /^(bliz-|blz-)/gi;     
    if(battleRegEx.test(secret)) {
        var tmp = secret.substring(secret.indexOf('-') + 1);
        if(checkSecret(tmp, 'base32')) {
            showMessage(chrome.i18n.getMessage('errorsecret') + secret);
            return;
        }
    } else if(checkSecret(secret, 'hex') && checkSecret(secret, 'base32')) {
        showMessage(chrome.i18n.getMessage('errorsecret') + secret);
        return;
    }
    updateSecret(function () {
        chrome.storage.sync.get(function (result) {
            var index = Object.keys(result).length;
            var addSecret = {};
            if (decodedPhrase) {
                addSecret[CryptoJS.MD5(secret)] = {
                    account : account,
                    issuer : '',
                    type : type,
                    secret : CryptoJS.AES.encrypt(secret, decodedPhrase).toString(),
                    index : index,
                    encrypted : true
                }
            } else {
                addSecret[CryptoJS.MD5(secret)] = {
                    account : account,
                    issuer : '',
                    type : type,
                    secret : secret,
                    index : index
                }
            }
            if ('hotp' === type) {
                addSecret[CryptoJS.MD5(secret)].counter = 0;
            }
            chrome.storage.sync.set(addSecret);
            document.getElementById('infoAction').className = '';
            document.getElementById('addAccount').className = '';
            document.getElementById('addAccount').style.opacity = 0;
            document.getElementById('account_input').value = '';
            document.getElementById('secret_input').value = '';
            document.getElementById('editAction').setAttribute('edit', 'false');
            document.getElementById('editAction').innerHTML = '<i class="fa fa-pencil"></i>';
            chrome.storage.sync.get(showCodes);
        });
    });
}

function beginCapture(preventEdit) {
    capturing = !!preventEdit;
    chrome.tabs.query({
        active : true,
        lastFocusedWindow : true
    }, function (tabs) {
        var tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, {
            action : 'capture'
        }, function (result) {
            if (result !== 'beginCapture') {
                showMessage(chrome.i18n.getMessage('capture_failed'));
            } else {
                updateSecret(function () {
                    window.close();
                });
            }
        });
    });
}

function startMoveBox(e) {
    dragBox = this;
    e.dataTransfer.effectAllowed = 'move';
}

function enterBox() {
    this.setAttribute('dropOver', 'true');
}

function leaveBox() {
    this.removeAttribute('dropOver');
}

function dropBox(e) {
    if (dragBox != this) {
        var tmpId = this.id;
        var tmpHtml = this.innerHTML;
        this.id = dragBox.id;
        this.innerHTML = dragBox.innerHTML;
        dragBox.id = tmpId;
        dragBox.innerHTML = tmpHtml;
    }
    this.removeAttribute('dropOver');
    return false;
}

function endMoveBox() {
    var deleteAction = document.getElementsByClassName('deleteAction');
    for (var i = 0; i < deleteAction.length; i++) {
        deleteAction[i].onclick = deleteCode;
    }
    var showQrAction = document.getElementsByClassName('showqr');
    for (var i = 0; i < showQrAction.length; i++) {
        showQrAction[i].onclick = showQr;
    }
}

function overBox(e) {
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function editCodes() {
    clearTimeout(editTimeout);
    if (capturing) {
        capturing = false;
        return;
    }
    var codes = document.getElementById('codes');
    if (this.getAttribute('edit') == 'false') {
        document.getElementById('infoAction').className = 'hidden';
        clearInterval(updateInterval);
        codes.className = 'edit';
        this.setAttribute('edit', 'true');
        this.innerHTML = '<i class="fa fa-check"></i>';
        var code = document.getElementsByClassName('code');
        var codeBox = document.getElementsByClassName('codeBox');
        for (var i = 0; i < code.length; i++) {
            var bulls = ''
                for (var b = 0; b < code[i].innerText.length; b++) {
                    bulls += '&bull;'
                }
                code[i].innerHTML = bulls;
            codeBox[i].draggable = 'true';
            codeBox[i].ondragstart = startMoveBox;
            codeBox[i].ondragenter = enterBox;
            codeBox[i].ondragleave = leaveBox;
            codeBox[i].ondragover = overBox;
            codeBox[i].ondrop = dropBox;
            codeBox[i].ondragend = endMoveBox;
        }
        codes.scrollTop = codes.scrollHeight;
    } else {
        document.getElementById('infoAction').className = '';
        codes.className = '';
        this.setAttribute('edit', 'false');
        this.innerHTML = '<i class="fa fa-pencil"></i>';
        clearInterval(updateInterval);
        updateSecret();
    }
}

function sortCode() {
    var codeBox = document.getElementsByClassName('codeBox');
    var newSecret = [];
    for (var index = 0, i = 0; i < codeBox.length; i++) {
        if (_secret[Number(codeBox[i].id.substr(8))] === null) {
            continue;
        }
        _secret[Number(codeBox[i].id.substr(8))].index = index;
        newSecret.push(_secret[Number(codeBox[i].id.substr(8))]);
        index++;
    }
    return newSecret;
}

function deleteCode() {
    var codeId = this.getAttribute('codeId');
    var key = this.getAttribute('key');
    codeId = Number(codeId);
    deleteIdList.push(codeId);
    deleteKeyList.push(key);
    document.getElementById('codeBox-' + codeId).style.display = 'none';
}

function updateCode() {
    for (var i = 0; i < _secret.length; i++) {
        if (!_secret[i].secret) {
            document.getElementById('code-' + i).innerText = chrome.i18n.getMessage('encrypted');
            document.getElementById('showqr-' + i).className = 'showqr hidden';
            if (!shownPassphrase) {
                shownPassphrase = true;
                document.getElementById('passphrase').className = 'fadein';
                setTimeout(function () {
                    document.getElementById('passphrase').style.opacity = 1;
                }, 200);
            }
        } else if (_secret[i].type !== 'hotp') {
            document.getElementById('code-' + i).innerText = getCode(_secret[i].secret);
            document.getElementById('showqr-' + i).className = 'showqr';
        }
    }
}

function update() {
    getSector();
    var second = new Date().getSeconds();
    if (localStorage.offset) {
        second += Number(localStorage.offset) + 30;
    }
    second = second % 30;
    if (second > 25) {
        document.getElementById('codes').className = 'timeout';
    } else {
        document.getElementById('codes').className = '';
    }
    if (second < 1) {
        updateCode();
    }
}

function getSector() {
    var second = new Date().getSeconds();
    if (localStorage.offset) {
        second += Number(localStorage.offset) + 30;
    }
    second = second % 30;
    var canvas = document.getElementById('sector');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 40, 40);
    ctx.fillStyle = '#888';
    sector(ctx, 20, 20, Math.PI / 180 * second / 30 * 360, Math.PI / 180 * (1 - second / 30) * 360, 16, 0, true);
    var url = canvas.toDataURL();
    var sectors = document.getElementsByClassName('sector');
    for (var i = 0; i < sectors.length; i++) {
        sectors[i].style.background = 'url(' + url + ') center / 20px 20px';
    }
}

function showCodes(result) {
    document.getElementById('codeList').innerHTML = '';
    if (result && result.secret) {
        result = changeDataForm(result);
    }
    if (!result && !_secret) {
        return false;
    } else {
        result = changeDataSub2Md5(result);
        if (result) {
            _secret = [];
            for (var i in result) {
                if (result[i].encrypted) {
                    if (decodedPhrase) {
                        try {
                            result[i].secret = CryptoJS.AES.decrypt(result[i].secret, decodedPhrase).toString(CryptoJS.enc.Utf8);
                        } catch (e) {
                            result[i].secret = '';
                        }
                    } else {
                        result[i].secret = '';
                    }
                }
                result[i].hash = i;
                _secret.push(result[i]);
            }
            _secret.sort(function (a, b) {
                return a.index - b.index;
            });
        }
        document.getElementById('infoAction').className = '';
        document.getElementById('editAction').setAttribute('edit', 'false');
        document.getElementById('editAction').innerHTML = '<i class="fa fa-pencil"></i>';
        for (var i = 0; i < _secret.length; i++) {
            try {
                _secret[i].issuer = decodeURIComponent(_secret[i].issuer);
            } catch (e) {}
            try {
                _secret[i].account = decodeURIComponent(_secret[i].account);
            } catch (e) {}
            var el = document.createElement('div');
            el.id = 'codeBox-' + i;
            el.className = 'codeBox';
            el.innerHTML = '<div class="deleteAction" codeId="' + i + '" key="' + _secret[i].hash + '"><i class="fa fa-minus-circle"></i></div>' +
                ('hotp' === _secret[i].type ? '<div codeId="' + i + '" class="counter"><i class="fa fa-repeat"></i></div>' : '<div class="sector"></div>') +
                (_secret[i].issuer ? ('<div class="issuer">' + _secret[i].issuer + '</div>') : '') +
                '<div class="issuerEdit"><input class="issuerEditBox" type="text" codeId="' + i + '" value="' + (_secret[i].issuer ? _secret[i].issuer : '') + '" /></div>' +
                '<div class="code' + ('hotp' === _secret[i].type ? ' hotp' : '') + '" id="code-' + i + '">&bull;&bull;&bull;&bull;&bull;&bull;</div>' +
                '<div class="account">' + _secret[i].account + '</div>' +
                '<div class="accountEdit"><input class="accountEditBox" type="text" codeId="' + i + '" value="' + _secret[i].account + '" /></div>' +
                '<div id="showqr-' + i + '" class="showqr"><i class="fa fa-qrcode"></i></div>' +
                '<div class="movehandle"><i class="fa fa-bars"></i></div>';
            document.getElementById('codeList').appendChild(el);
            if (!_secret[i].encrypted) {
                el.setAttribute('unencrypted', 'true');
                var warning = document.createElement('div');
                warning.className = 'warning';
                warning.innerText = chrome.i18n.getMessage('unencrypted_secret_warning');
                warning.onclick = function () {
                    document.getElementById('security').className = 'fadein';
                    setTimeout(function () {
                        document.getElementById('security').style.opacity = 1;
                    }, 200);
                };
                el.appendChild(warning);
            }

        }
        var codeCopy = document.getElementsByClassName('code');
        for (var i = 0; i < codeCopy.length; i++) {
            codeCopy[i].onclick = copyCode;
        }
        var deleteAction = document.getElementsByClassName('deleteAction');
        for (var i = 0; i < deleteAction.length; i++) {
            deleteAction[i].onclick = deleteCode;
        }
        var showQrAction = document.getElementsByClassName('showqr');
        for (var i = 0; i < showQrAction.length; i++) {
            showQrAction[i].onclick = showQr;
        }
        var counterAction = document.getElementsByClassName('counter');
        for (var i = 0; i < counterAction.length; i++) {
            counterAction[i].onclick = getNewHotpCode;
        }
        var accountEditBox = document.getElementsByClassName('accountEditBox');
        for (var i = 0; i < accountEditBox.length; i++) {
            accountEditBox[i].onblur = saveAccount;
        }
        var issuerEditBox = document.getElementsByClassName('issuerEditBox');
        for (var i = 0; i < issuerEditBox.length; i++) {
            issuerEditBox[i].onblur = saveIssuer;
        }
        updateCode();
        update();
        clearInterval(updateInterval);
        updateInterval = setInterval(update, 500);
    }
}

function saveAccount() {
    var codeId = this.getAttribute('codeId');
    var s = this.value;
    s = s.replace(/&/g, "&amp;");
    s = s.replace(/</g, "&lt;");
    s = s.replace(/>/g, "&gt;");
    s = s.replace(/ /g, "&nbsp;");
    s = s.replace(/\'/g, "&#39;");
    s = s.replace(/\"/g, "&quot;");
    _secret[codeId].account = s;
}

function saveIssuer() {
    var codeId = this.getAttribute('codeId');
    var s = this.value;
    s = s.replace(/&/g, "&amp;");
    s = s.replace(/</g, "&lt;");
    s = s.replace(/>/g, "&gt;");
    s = s.replace(/ /g, "&nbsp;");
    s = s.replace(/\'/g, "&#39;");
    s = s.replace(/\"/g, "&quot;");
    _secret[codeId].issuer = s;
}

function changeDataForm(result) {
    var secret = result.secret;
    var newResult = {};
    for (var i = 0; i < secret.length; i++) {
        newResult[secret[i].secret] = secret[i];
        newResult[secret[i].secret].index = i;
    }
    chrome.storage.sync.set(newResult);
    chrome.storage.sync.remove('secret');
    return newResult;
}

function changeDataSub2Md5(result) {
    var modified = false;
    for (i in result) {
        if (i == result[i].secret) {
            modified = true;
            result[CryptoJS.MD5(i)] = result[i];
            delete result[i];
            chrome.storage.sync.remove(i);
        }
    }
    if (modified) {
        chrome.storage.sync.set(result);
    }
    return result;
}

function showQr() {
    var codeId = this.id.substr(7);
    codeId = Number(codeId);
    var secret = _secret[codeId];
    var label = secret.issuer ? (secret.issuer + ':' + secret.account) : secret.account;
    var otpauth = 'otpauth://' + (secret.type || 'totp') + '/' + label + '?secret=' + secret.secret + (secret.issuer ? ('&issuer=' + secret.issuer) : '') + (('hotp' === secret.type && secret.counter) ? ('&counter=' + secret.counter) : '');
    var qrcode = new QRCode('qr', {
            text : otpauth,
            width : 128,
            height : 128,
            colorDark : '#000000',
            colorLight : '#ffffff',
            correctLevel : QRCode.CorrectLevel.L
        }, function (qrUrl) {
            document.getElementById('qr').style.backgroundImage = 'url(' + qrUrl + ')';
            document.getElementById('qr').className = 'qrfadein';
            setTimeout(function () {
                document.getElementById('qr').style.opacity = 1;
            }, 200);
        });
}

function showExport() {
    document.getElementById('export').className = 'fadein';
    setTimeout(function () {
        document.getElementById('export').style.opacity = 1;
        chrome.storage.sync.get(function (data) {
            document.getElementById('exportData').value = JSON.stringify(data);
        });
    }, 200);
}

function copyCode() {
    var code = this.innerText;
    if ('Encrypted' == code) {
        document.getElementById('passphrase').className = 'fadein';
        setTimeout(function () {
            document.getElementById('passphrase').style.opacity = 1;
        }, 200);
        return;
    } else if (!/^\d+$/.test(code)) {
        return;
    }
    chrome.permissions.request({
        permissions : ['clipboardWrite']
    }, function (granted) {
        if (granted) {
            var codeClipboard = document.getElementById('codeClipboard');
            codeClipboard.value = code;
            codeClipboard.focus();
            codeClipboard.select();
            document.execCommand('Copy');
            showNotification(chrome.i18n.getMessage('copied'));
        }
    });
}

function encryptSecret(phrase, updatePhrase, success, fail) {
    var errorPhrase = false;
    var decryptedSecret;
    chrome.storage.sync.get(function (result) {
        for (var i in result) {
            decryptedSecret = '';
            if (result[i].encrypted && decodedPhrase) {
                try {
                    decryptedSecret = CryptoJS.AES.decrypt(result[i].secret, decodedPhrase).toString(CryptoJS.enc.Utf8);
                } catch (e) {
                    decryptedSecret = '';
                }
                if (decryptedSecret) {
                    result[i].secret = decryptedSecret;
                } else if (updatePhrase) {
                    errorPhrase = true;
                    continue;
                }
            }
            if (result[i].encrypted && !decryptedSecret && !updatePhrase) {
                try {
                    decryptedSecret = CryptoJS.AES.decrypt(result[i].secret, phrase).toString(CryptoJS.enc.Utf8);
                } catch (e) {
                    decryptedSecret = '';
                }
                if (decryptedSecret) {
                    result[i].secret = decryptedSecret;
                } else {
                    errorPhrase = true;
                    continue;
                }
            }
            if (phrase && decodedPhrase) {
                result[i].secret = CryptoJS.AES.encrypt(result[i].secret, updatePhrase ? phrase : decodedPhrase).toString();
                result[i].encrypted = true;
            } else if (phrase && !decodedPhrase) {
                result[i].secret = CryptoJS.AES.encrypt(result[i].secret, phrase).toString();
                result[i].encrypted = true;
            } else {
                result[i].encrypted = false;
            }
        }
        if (updatePhrase || !decodedPhrase) {
            decodedPhrase = phrase;
            if (localStorage.notRememberPassphrase === 'true') {
                document.cookie = 'passphrase=' + CryptoJS.AES.encrypt(phrase, '').toString();
                localStorage.removeItem('encodedPhrase');
            } else {
                localStorage.encodedPhrase = CryptoJS.AES.encrypt(phrase, '').toString();
            }
        }
        chrome.storage.sync.set(result);
        showCodes(result);
        if (errorPhrase && fail) {
            fail();
        } else if (success) {
            success();
        }
    });
}

function showNotification(message) {
    var notification = document.getElementById('notification');
    notification.innerText = message;
    notification.className = 'fadein';
    clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(function () {
            notification.className = 'fadeout';
            setTimeout(function () {
                notification.className = '';
            }, 200);
        }, 1000);
}

function syncTimeWithGoogle(showStatusBox) {
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', 'https://www.google.com/generate_204');
    var xhrAbort = setTimeout(function () {
            xhr.abort();
            if (showStatusBox) {
                showMessage(chrome.i18n.getMessage('updateFailure'));
            }
        }, 5000);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            clearTimeout(xhrAbort);
            var serverTime = new Date(xhr.getResponseHeader('date'));
            serverTime = serverTime.getTime();
            var clientTime = new Date();
            clientTime = clientTime.getTime();
            var offset = Math.round((serverTime - clientTime) / 1000);
            if (!serverTime) {
                if (showStatusBox) {
                    showMessage(chrome.i18n.getMessage('updateFailure'));
                }
            } else if (Math.abs(offset) <= 300) { // within 5 minutes
                localStorage.offset = Math.round((serverTime - clientTime) / 1000);
                if (showStatusBox) {
                    showMessage(chrome.i18n.getMessage('updateSuccess'));
                }
            } else {
                showMessage(chrome.i18n.getMessage('clock_too_far_off'));
            }
        }
    };
    xhr.send();
}

function getNewHotpCode() {
    var codeId = this.getAttribute('codeId');
    if (this.getAttribute('disabled') == 'true') {
        return;
    }
    if (document.getElementById('code-' + codeId).innerText == 'Encrypted') {
        document.getElementById('passphrase').className = 'fadein';
        setTimeout(function () {
            document.getElementById('passphrase').style.opacity = 1;
        }, 200);
        return;
    }
    this.setAttribute('disabled', 'true');
    setTimeout(function () {
        this.removeAttribute('disabled');
    }
        .bind(this), 5000);
    document.getElementById('code-' + codeId).setAttribute('hasCode', 'true');
    document.getElementById('code-' + codeId).innerText = getCode(_secret[codeId].secret, _secret[codeId].counter);
    _secret[codeId].counter++;
    chrome.storage.sync.get(function (secret) {
        secret[CryptoJS.MD5(_secret[codeId].secret)].counter = _secret[codeId].counter;
        chrome.storage.sync.set(secret);
    });
}

function resize(zoom) {
    zoom = Number(zoom);
    if (zoom !== 100) {
        document.body.style.marginBottom = 480 * (zoom / 100 - 1) + 'px';
        document.body.style.marginRight = 320 * (zoom / 100 - 1) + 'px';
        document.body.style.transform = 'scale(' + (zoom / 100) + ')';
    }
}

(function () {
    // Remind backup
    var clientTime = new Date();
    clientTime = Math.floor(clientTime.getTime() / 1000 / 3600 / 24);
    if (!localStorage.lastRemindingBackupTime) {
        localStorage.lastRemindingBackupTime = clientTime;
    } else if (clientTime - localStorage.lastRemindingBackupTime >= 30 || clientTime - localStorage.lastRemindingBackupTime < 0) {
        showMessage(chrome.i18n.getMessage('remind_backup'));
        localStorage.lastRemindingBackupTime = clientTime;
    }

    // Resize
    var zoom = localStorage.zoom || '100';
    document.getElementById('resize_list').value = zoom;
    resize(zoom);

    // Click extension name 5 times to show export box
    var extName = document.getElementById('extName');
    var count = 0;
    var timer;
    extName.onclick = function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
                count = 0;
            }, 1000);

        count++;
        if (count == 5) {
            count = 0;
            showExport();
        }
    };
})();
