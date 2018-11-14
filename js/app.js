const {app} = require('electron')
const mainWindow = require('./main_window.js')
module.exports = {
    run : function() {
        app.on('ready', ()=> {
            mainWindow.createMainWindow();
        });
        mainWindow.processMessages();
    },

    exit : function() {
        app.exit(0);
    }
}