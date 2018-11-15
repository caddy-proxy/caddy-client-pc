const {app} = require('electron')
const mainWindow = require('./main_window.js')

module.exports = {
    run : function() {
        console.log('run ......');
        app.on('ready', ()=> {
            mainWindow.createMainWindow();
        });
        app.on('window-all-closed', () => {
            console.log('quit ...');
            if (process.platform !== "darwin") {
                app.quit();
            }
            //app.quit();
          })
        mainWindow.processMessages();
    },

    
}