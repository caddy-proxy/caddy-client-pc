const logger = require('./logger.js');

module.exports = {
    //return connection string from shared url or url returned by 
    //useful part of link:
    //hs://base64(username:password)@host:port/?caddy=1
    //share link format : 
    //https://caddyproxy-website-url/path/to/caddy-invitepage.html#urlencode(hs://base64(username:password)@host:port/?caddy=1)
    //manage url:
    //hs://base64(username:password)@host:port/?caddy=1&m=md5hex(admin=username)  
    getConnectionStr : function(url) {
        if (url.indexOf('https://') == 0) {
            //its a share link
            let parts = url.split('#');
            if (parts.length > 0) {

            } else {
                logger.log('url format is error:' + url);
                return '';
            }

        } else if (url.indexOf('hs://') == 0) {
            if(url.indexOf('&m=') != -1) {
                //admin url
                
            } else {
                //guest url
            }
        }
    },
    
    getServerUrl : function(connStr) {

    }
}
