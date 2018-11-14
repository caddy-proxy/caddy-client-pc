
const fs = require('fs');
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
        
    }
}