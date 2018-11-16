const {BrowserWindow, app} = require('electron');
const path =  require('path');
const {ipcMain} = require('electron');
const logger = require('./logger.js');
const http = require('http');
const messages = require('./messages.js');
const urlParser =  require('./url_parser.js');
const tls = require('tls');
const { execFile } = require('child_process');
const fs = require('fs');


let isStartHttpServer = false;
let mainWindow = null;

let connState = 'disconnected'; // disconnected, connected
let  httpServer = null;


function sendReplyMsg(event, msg) {
    event.sender.send('msg-reply', msg);
}

function setConnectState(state) {
    connState = state;
}


function setProxyConfigWin() {
    execFile('winproxy.exe', ['-autoproxy', 'http://127.0.0.1:8081/pac.url']);
}

function unsetProxyConfigWin() {
    execFile('winproxy.exe', ['-unproxy']);
}

function setProxyConfigMac() {

}

function unsetProxyConfigMac() {

}


function setProxyConfigLinux() {

}

function unsetProxyConfigLinux() {

}

function setProxyConfig() {
    let OS = getOSType();
    if( OS == 'darwin') {
        setProxyConfigMac();
    } else if ( OS == 'linux') {
        setProxyConfigLinux
    } else if ( OS == 'win32') {
        setProxyConfigWin();
    } else {
        logger.log('set proxy config failed ! os error');
    }
}

function unsetProxyConfig() {
    let OS = getOSType();
    if( OS == 'darwin') {
        unsetProxyConfigMac();
    } else if ( OS == 'linux') {
        unsetProxyConfigLinux();
    } else if ( OS == 'win32') {
        unsetProxyConfigWin();
    } else {
        logger.log('set unproxy config failed ! os error');
    }
}


function getOSType() {
    return process.platform;
}


function onConnectMsg(event, url) {
    console.log('onConnectMsg url:' + url);
    startHttpServer();
    if (!urlParser.parseLinkStr(url)) {
        logger.log('url format is error!!!');
        let msg = messages.buildMsg(messages.MSG_TYPE_CONNECT_RET, -1);
        sendReplyMsg(event, msg);
        return;
    }
    if (connState == 'disconnected') {
        let options = {
            host : urlParser.getProxyHost(),
            port : urlParser.getProxyPort(),
            rejectUnauthorized :  false,
            checkServerIdentity: function(servername, cert){
            logger.log('check server name :' + servername);
            return 'undefined';
            }
        };
        let tlsSocket = tls.connect(options, () => {
            logger.log('connect to proxy server success!!!!!');
            setConnectState('connected');
            setProxyConfig();
            sendReplyMsg(event, messages.buildMsg(messages.MSG_TYPE_CONNECT_RET, 0));
        });
        tlsSocket.setTimeout(8000);
        tlsSocket.on('timeout', () => {
            logger.log('tls connection timeout!');
            tlsSocket.end();
        });
        tlsSocket.on('end', () => {
            logger.log('tls connection remote ended!');
            tlsSocket.end();
        });
    } else if(connState == 'connected') {
        logger.log(mainWindow,' state is connected, do nothing');
    } else {
        logger.log(mainWindow,'unknown state : ' + connState);
    }

}

function onDisconnectMsg(code) {    
    logger.log('disconnect  server code :' + code);
    unsetProxyConfig();
    if( connState == 'connected') {
        setConnectState('disconnected');
    }
}

function onAsyncMsg(event, msg) {
    logger.log('receive async msg ' + msg.type);
    if(msg.type == messages.MSG_TYPE_CONNECT) {
        onConnectMsg(event, msg.param);
    } else if (msg.type == messages.MSG_TYPE_DISCONNECT) {
        onDisconnectMsg(msg.param);
    } else if (msg.type == messages.MSG_TYPE_QUIT) {
        closeWindowEx();
    } else {
        logger.log(mainWindow,'unknown msg '+ msg.type);
    }

}



//handle http CONNECT request
function handleConnect(req, socket, headBuffer) {
    let targetHost = req.url;
    let httpsReq = 'CONNECT ' + targetHost + ' HTTP/1.1\r\n\r\n'
    if (connState == 'disconnected') {
        console.log('disconnected with proxy server. sorry');
        return;
    }
    //const options;
    const options = {
        host: urlParser.getProxyHost(),
        port: urlParser.getProxyPort(),
        rejectUnauthorized :  false,
        checkServerIdentity: function(servername, cert){
            logger.log('check server name :' + servername);
            return 'undefined';
        }
    };
    const tlsSocket = tls.connect(options, () => {
        setConnectState('connected');
        logger.log('connect proxy server success for ' + targetHost);
        tlsSocket.write(httpsReq);
    });
    //10 seconds for waiting data pipe
    tlsSocket.setTimeout(10000);
    socket.setTimeout(10000);
    tlsSocket.on('end', () => {
        tlsSocket.end();
        logger.log('tls stream closed');
    });
    socket.on('end', () => {
        socket.end();
        logger.log('http stream closed');
    });
    socket.on('timeout', () => {
        socket.end();
    });
    tlsSocket.on('timeout', () => {
        tlsSocket.end();
    });

    tlsSocket.on('data', (data) => {
        socket.write(data);
    });

    socket.on('data', (data) => {
        tlsSocket.write(data);
    });
}

//listen on localhost:8081
function startHttpServer() {
    if(isStartHttpServer) {
       logger.log('has started http server');
       return; 
    }
    httpServer = http.createServer();
    httpServer.on('clientError', (err, socket) => {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    httpServer.on('error', (err) => {
        if(err.code == 'EADDRINUSE') {
            logger.log('port 8081 is being used');
        } else {
            logger.log('listen error on localhost:8081');
        }
    });

    httpServer.on('connect', (req, socket, headBuffer) => {
        handleConnect(req, socket, headBuffer);
    });
    httpServer.on('request', (req, res) =>{
        if(req.url == '/pac.url') {
           let data = fs.readFileSync('./pac.url');
           res.end(data);
        } else {
            logger.log('unknown request from local :' +  req.url);
        }
    });

    httpServer.listen(8081, 'localhost');
    isStartHttpServer = true;
    logger.log(mainWindow,'start http proxy server success!!');
}

function stopHttpServer(){
    isStartHttpServer = false;
    if ( httpServer != null) {
        httpServer.close(()=> {
            logger.log('http proxy server closed');
        });
    }
}

function closeWindowEx() {
    console.log('close window ex');
    stopHttpServer();
    mainWindow.close();
}

module.exports = {
    createMainWindow :  function() {
        let winOptions = {
            width:500, height:500, 
            center:true, maximizable:false, 
            minimizable:true,closable:true, 
            title : 'caddy-client',
            frame : false,
            resizable: false
        }
        mainWindow = new BrowserWindow(winOptions);
        let mainPage = path.join('file://', __dirname, '../html/mainpage.html');
        mainWindow.on('ready-to-show', ()=>{
            mainWindow.show();
        }); 
        mainWindow.loadURL(mainPage);
        mainWindow.on('close', (ev) => {
            mainWindow = null;
        });
        
    },

    closeWindow :  function() {
        closeWindowEx();
    },

    processMessages : function() {
        ipcMain.on('async-msg', (event, args) => {
            onAsyncMsg(event, args);
        });
    }
}

