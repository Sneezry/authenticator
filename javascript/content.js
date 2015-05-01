function showGrayLayout() {
    var grayLayout = document.getElementById('__ga_grayLayout__');
    if (!grayLayout) {
        grayLayout = document.createElement('div');
        grayLayout.id = '__ga_grayLayout__';
        document.body.appendChild(grayLayout);
        var scan = document.createElement('div');
        scan.className = 'scan';
        scan.style.background = 'url(' + chrome.extension.getURL('images/scan.gif') + ') no-repeat center';
        grayLayout.appendChild(scan);
        var captureBox = document.createElement('div');
        captureBox.id = '__ga_captureBox__';
        grayLayout.appendChild(captureBox);
        grayLayout.onmousedown = grayLayoutDown.bind(this);
        grayLayout.onmousemove = grayLayoutMove.bind(this);
        grayLayout.onmouseup = grayLayoutUp.bind(this);
        grayLayout.oncontextmenu = function () {
            var e = event || window.event;
            e.preventDefault();
            return false;
        };
    }
    grayLayout.style.display = 'block';
}

function grayLayoutDown(event) {
    var e = event || window.event;
    if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        return false;
    }
    var captureBox = document.getElementById('__ga_captureBox__');
    this.captureBoxLeft = e.clientX;
    this.captureBoxTop = e.clientY;
    captureBox.style.left = e.clientX + 'px';
    captureBox.style.top = e.clientY + 'px';
    captureBox.style.width = '1px';
    captureBox.style.height = '1px';
    captureBox.style.display = 'block';
}

function grayLayoutMove(event) {
    var e = event || window.event;
    if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        return false;
    }
    var captureBox = document.getElementById('__ga_captureBox__');
    var captureBoxLeft = Math.min(this.captureBoxLeft, e.clientX);
    var captureBoxTop = Math.min(this.captureBoxTop, e.clientY);
    var captureBoxWidth = Math.abs(this.captureBoxLeft - e.clientX) - 1;
    var captureBoxHeight = Math.abs(this.captureBoxTop - e.clientY) - 1;
    captureBox.style.left = captureBoxLeft + 'px';
    captureBox.style.top = captureBoxTop + 'px';
    captureBox.style.width = captureBoxWidth + 'px';
    captureBox.style.height = captureBoxHeight + 'px';
}

function grayLayoutUp(event) {
    var e = event || window.event;
    var grayLayout = document.getElementById('__ga_grayLayout__');
    var captureBox = document.getElementById('__ga_captureBox__');
    var captureBoxLeft = Math.min(this.captureBoxLeft, e.clientX) + 1;
    var captureBoxTop = Math.min(this.captureBoxTop, e.clientY) + 1;
    var captureBoxWidth = Math.abs(this.captureBoxLeft - e.clientX) - 1;
    var captureBoxHeight = Math.abs(this.captureBoxTop - e.clientY) - 1;
    captureBoxLeft *= window.devicePixelRatio;
    captureBoxTop *= window.devicePixelRatio;
    captureBoxWidth *= window.devicePixelRatio;
    captureBoxHeight *= window.devicePixelRatio;
    setTimeout(function () {
        captureBox.style.display = 'none';
        grayLayout.style.display = 'none';
    }, 100);
    if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        return false;
    }
    //make sure captureBox and grayLayout is hidden
    setTimeout(function () {
        sendPosition(captureBoxLeft, captureBoxTop, captureBoxWidth, captureBoxHeight);
    }, 200);
    return false;
}

function sendPosition(left, top, width, height) {
    chrome.runtime.sendMessage({
        action : 'position',
        info : {
            left : left,
            top : top,
            width : width,
            height : height,
            windowWidth : window.innerWidth
        }
    });
}

function showQrCode(msg) {
    var left = (screen.width / 2) - 200;
    var top = (screen.height / 2) - 100;
    var url = chrome.extension.getURL('qr.html') + '?' + encodeURIComponent(msg);
    window.open(url, '_blank', 'toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, copyhistory=no, width=400, height=200, left=' + left + ',top=' + top);
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'capture') {
        sendResponse('beginCapture');
        showGrayLayout();
    } else if (message.action === 'errorsecret') {
        alert(chrome.i18n.getMessage('errorsecret') + message.secret);
    } else if (message.action === 'errorqr') {
        alert(chrome.i18n.getMessage('errorqr'));
    } else if (message.action === 'added') {
        alert(message.account + chrome.i18n.getMessage('added'));
    } else if (message.action === 'text') {
        showQrCode(message.text);
    }
});
