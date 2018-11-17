
//this module will run in directory which is same with mainpage.html
const {ipcRenderer, clipboard} = require('electron');
const console = require('console'); 
const logger = require('../js/logger.js');
const messages = require('../js/messages.js');
const urlParser = require('../js/url_parser');
const prompt = require('electron-prompt');


//values: connected , disconnected
let connectionState = 'disconnected';

function setConnectionState(state) {
    if( state == 'connected') {
        $('#connect-status').text('已连接');
    } else {
        $('#connect-status').text('已断开');
    }
    connectionState = state;
}


function sendAsyncMsg(msg) {
    ipcRenderer.send('async-msg', msg);
}


function processMsgReply(msg) {
    console.log('get msg reply '+ msg.type);
    if( msg.type == messages.MSG_TYPE_CONNECT_RET) {
        if(msg.param == 0) {
            //success
            setConnectionState('connected');
            logger.log('connect proxy server success!!')
            return;
        } else {
            //error
            setConnectionState('disconnected');
            logger.log('connect proxy server failed ' + msg.param);
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
    let msg ;
    if (connectionState == 'disconnected') {
        let url = decodeURIComponent($('#connect-url').val());
        logger.log('connect url is :' + url);
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



function onClickSave() {
    let linkStr = $('#connect-url').val();
    if( !urlParser.parseLinkStr(linkStr) ) {
       alert('url格式不正确!');
       return;
    }
    let promptOptions = {
        title: '提示',
        label: '名字(不要重复):',
        value: '',
        width: 250,
        inputAttrs: {
            type: 'text',
            required: true
        },
        type: 'input'
    };
    prompt(promptOptions)
    .then((v) => {
        if(v === null) {
            alert('未输入保存配置的名称!');
            console.log('user cancelled');
        } else {
            try {
                 urlParser.save(v);
                 setTimeout(()=>{
                    updateProfileList();
                 }, 1000);
            } catch(err) {
                 alert('保存失败!');
            }
        }
    })
    .catch(console.error);

}



function onProfileClick(ev) {
    console.log('click:' + ev.target.id);
}
function onProfileDel(ev) {
    console.log('del click:' + ev.target.id);
    let profileName = ev.target.id.substr(4);
    try {
        urlParser.delProfile(profileName);
        setTimeout(()=>{
            updateProfileList();
        }, 2000);
    } catch(err) {
        alert('删除失败');
    }
}

function updateProfileList() {
    console.log('update profile list');
    $('#profiles').empty();
    let profiles = urlParser.getAllProfiles();
    for(var i in profiles) {
        var line = "<div><div class='profile-item-1'><a id ='"+profiles[i].name+"'>"+profiles[i].name+
        "</a></div><div class='profile-item-2'>"+profiles[i].url+
        "</div><div class='profile-item-3'><button id='btn-"+ profiles[i].name+"'>删除</button></div></div>";
        //logger.log('add line '+ line);
        $('#profiles').append(line);
        $('#' + profiles[i].name).bind('click', (ev) =>{onProfileClick(ev);});
        $('#btn-' + profiles[i].name).bind('click', (ev) =>{onProfileDel(ev);});
    }       
}



function initProfileUIList(){
    updateProfileList();
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

    $('#save-button').bind('click', (ev) => {
        onClickSave();
    });
    initProfileUIList();


    processMessages();
});