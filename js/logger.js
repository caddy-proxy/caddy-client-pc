
const fs = require('fs');
const messages = require('./messages.js');
var elog = require('electron-log');

const logTerminal = 'file';
//const logTerminal = 'console';
module.exports = {
    //log: log string
    log : function(log) {
        if (logTerminal == 'file') {
            log += '\n';
            elog.log(log);
        } else if (logTerminal == 'console') {
            elog.log(log);
        }
    },
    
}