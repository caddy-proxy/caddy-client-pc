const {BrowserWindow} = require('electron');
const path =  require('path');
const app = require('./app.js');
const {ipcMain} = require('electron');
const logger = require('./logger.js');
const http = require('http');
const messages = require('./messages.js');
const urlParser =  require('./url_parser.js');
const https = require('https');
const tls = require('tls');
let isStartHttpServer = false;
let mainWindow = null;

let connState = 'disconnected'; // disconnected, connected
let  httpServer = null;

function onConnectMsg(url) {
    console.log('onConnectMsg');
    startHttpServer();
    let connectionStr = urlParser.getConnectionStr(url);
    let serverUrl = urlParser.getServerUrl(connectionStr);
    if (connState == 'disconnected') {
        
    } else if(connState == 'connected') {
        
        logger.mainLog(mainWindow,' state is connected, do nothing');
    } else {
        logger.mainLog(mainWindow,'unknown state : ' + connState);
    }

}

function onDisconnectMsg(code) {    
    logger.mainLog(mainWindow, 'disconnect  server code :' + code);
}

function onAsyncMsg(event, msg) {
    console.log('main receive msg ' + msg.type);
    logger.mainLog(mainWindow,'receive async msg ' + msg.type);
    if(msg.type == messages.MSG_TYPE_CONNECT) {
        onConnectMsg(msg.param);
    } else if (msg.type == messages.MSG_TYPE_DISCONNECT) {
        onDisconnectMsg(msg.param);
    } else {
        logger.mainLog(mainWindow,'unknown msg '+ msg.type);
    }

}

function sendReplyMsg(event, msg) {
    event.send('msg-reply', msg);
}

//handle http CONNECT request
function handleConnect(req, socket, headBuffer) {
    let targetHost = req.url;
    let httpsReq = 'CONNECT ' + targetHost + ' HTTP/1.1\r\n\r\n';

    //const options;

}

//listen on localhost:8081
function startHttpServer() {
    if(isStartHttpServer) {
       logger.mainLog(mainWindow, 'has started http server');
       return; 
    }
    httpServer = http.createServer();
    httpServer.on('clientError', (err, socket) => {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    httpServer.on('error', (err) => {
        if(err.code == 'EADDRINUSE') {
            logger.mainLog(mainWindow,'port 8081 is being used');
        } else {
            logger.mainLog(mainWindow,'listen error on localhost:8081');
        }
    });

    httpServer.on('connect', (req, socket, headBuffer) => {
        handleConnect(req, socket, headBuffer);
    });

    httpServer.listen(8081, 'localhost');
    isStartHttpServer = true;
    logger.mainLog(mainWindow,'start http proxy server success!!');
}

function stopHttpServer(){
    isStartHttpServer = false;
    if ( httpServer != null) {
        httpServer.close(()=>{
            logger.mainLog(mainWindow, 'http proxy server closed');
        });
    }
}


module.exports = {
    createMainWindow :  function() {
        mainWindow = new BrowserWindow({width:650, height:700, 
            center:true, maximizable:false, minimizable:true,closable:false, title : 'caddy-client'});
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
        stopHttpServer();
        mainWindow.closeWindow();
        app.exit();
    },

    processMessages : function() {
        ipcMain.on('async-msg', (event, args) => {
            onAsyncMsg(event, args);
        });
    }
}

