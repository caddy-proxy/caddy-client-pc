
const fs = require('fs');
const messages = require('./messages.js');
// 'ui' or 'file' or 'console'
const logTerminal = 'ui';
//const logTerminal = 'file';
//const logTerminal = 'console';
module.exports = {
    //log: log string
    log : function(log) {
        if (logTerminal == 'ui') {
            let oldLog = $('#log-area').val();
            if ( oldLog.length  > 0) {
                oldLog += '\n';
            }
            oldLog += log;
            $('#log-area').val(oldLog);
        } else if (logTerminal == 'file') {
            log += '\n';
            fs.writeFileSync('caddyclient.log', log, {'flag':'a'});
        } else if (logTerminal == 'console') {
            console.log(log);
        }
    },
    mainLog : function(win, log) {
        if (logTerminal == 'ui') {
            console.log('logger send msg :' + log);
            win.webContents.send('msg-reply', {'type': messages.MSG_TYPE_LOG, 'log': log});
        } else if (logTerminal == 'file') {
            log += '\n';
            fs.writeFileSync('caddyclient.log', log, {'flag':'a'});
        } else if (logTerminal == 'console') {
            console.log(log);
        }
    }
}