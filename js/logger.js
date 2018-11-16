
const fs = require('fs');
const messages = require('./messages.js');

//const logTerminal = 'file';
const logTerminal = 'console';
module.exports = {
    //log: log string
    log : function(log) {
        if (logTerminal == 'file') {
            log += '\n';
            fs.writeFileSync('caddyclient.log', log, {'flag':'a'});
        } else if (logTerminal == 'console') {
            console.log(log);
        }
    },
    
}