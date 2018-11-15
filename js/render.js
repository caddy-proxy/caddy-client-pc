
const console = require('console'); 
const logger = require('./logger.js');
const {ipcRenderer, clipboard} = require('electron');
const messages = require('./messages.js');
const urlParser = require('./url_parser');

//values: connected , disconnected
let connectionState = 'disconnected';

function setConnectionState(state) {
    if( state == 'connected') {
        $('#connect-status').text('已连接');
    } else {
        $('#connect-status').text('连接断开');
    }
    connectionState = state;
}


function sendAsyncMsg(msg) {
    ipcRenderer.send('async-msg', msg);
}


function processMsgReply(msg) {
    console.log('get msg reply '+ msg.type);
    if( msg.type == messages.MSG_TYPE_CONNECT_RET) {
        if(msg.code == 0) {
            //success
            setConnectionState('connected');
            logger.log('connect proxy server success!!')
            return;
        } else {
            //error
            setConnectionState('disconnected');
            logger.log('connect proxy server failed ' + msg.code);
        }
    } else if (msg.type == messages.MSG_TYPE_LOG) {
        logger.log(msg.log);
    }
}


function processMessages() {
    ipcRenderer.on('msg-reply', (event, args) =>{
        processMsgReply(args);
    });

}



function onClickConnection() {
    logger.log('click connect button');
    let msg ;
    if (connectionState == 'disconnected') {
        let url = $('#connect-url').val();
        console.log('url is ' + url);
        msg = messages.buildMsg(messages.MSG_TYPE_CONNECT, url);
        sendAsyncMsg(msg);
    } else if (connectionState == 'connected') {
        msg = messages.buildMsg(messages.MSG_TYPE_DISCONNECT, '');
        sendAsyncMsg(msg);
    } else {
        logger.log('connection state is error :' + connectionState);
    }
    
}

function onClickShare() {
   let linkStr = $('#connect-url').val();
   if( !urlParser.parseLinkStr(linkStr) ) {
       logger.log('can not share, format is error');
       return;
   }
   $('#share-input').val(urlParser.getShareLinkStr());
}

function onClickCp() {
    let url = $('#share-input').val();
    clipboard.writeText(url);
}

function onClickQuit() {
    logger.log('click quit button');
    let msg = messages.buildMsg(messages.MSG_TYPE_QUIT, 0);
    sendAsyncMsg(msg)
    
}

$(()=> {
    $('#connect-button').bind('click', (ev)=>{
        onClickConnection();
    });

    $('#share-button').bind('click', (ev) => {
        onClickShare();
    });

    $('#cp-button').bind('click', (ev) => {
        onClickCp();
    });

    $('#quit-button').bind('click', (ev) => {
        onClickQuit();
    });

    processMessages();
});