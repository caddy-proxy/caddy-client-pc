const {BrowserWindow} = require('electron');
const path =  require('path');
const app = require('./app.js');
const {ipcMain} = require('electron');
const logger = require('./logger.js');
const http = require('http');
const messages = require('./messages.js');
const urlParser =  require('./url_parser.js');
const https = require('https');

let connState = 'disconnected'; // disconnected, connected
let  httpServer;

function onConnectMsg(url) {
    let connectionStr = urlParser.getConnectionStr(url);
    let serverUrl = urlParser.getServerUrl(connectionStr);
    if (connState == 'disconnected') {
        
    } else if(connState == 'connected') {
        logger.log(' state is connected, do nothing');
    } else {
        logger.log('unknown state : ' + connState);
    }

}

function onDisconnectMsg() {    

}

function onAsyncMsg(event, msg) {
    logger.log('receive async msg ' + msg.type);
    if(msg.type == messages.MSG_TYPE_CONNECT) {
        onConnectMsg(msg.param);
    } else if (msg.type == messages.MSG_TYPE_DISCONNECT) {

    } else {
        logger.log('unknown msg '+ msg.type);
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

    httpServer.listen(8081, 'localhost');
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
        startHttpServer();
    },

    closeWindow :  function() {
        mainWindow.closeWindow();
        app.exit();
    },

    processMessages : function() {
        ipcMain.on('async-msg', (event, args) => {
            onAsyncMsg(event, args);
        });
    }
}

