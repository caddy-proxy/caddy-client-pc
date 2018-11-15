const logger = require('./logger.js');
const md5 = require('md5');
const fs = require('fs');

let clientDownloadUrl = '';
let proxyHost = '';
let proxyPort = 0;
let proxyUser = '';
let proxyPwd = '';
let isAdmin = false;

const clientDownloadURL = 'https://caddy-forwardproxy/download/client/download.html';
const saveFilePath = "./config.dat";

//parse : base64(username:password)
function parseUserPwd(userPwdStr) {
    let userPwd = new Buffer(userPwdStr, 'base64').toString();
    let userPwdParts =  userPwd.split(':');
    if(userPwdParts.length == 2) {
        proxyUser = userPwdParts[0];
        proxyPwd = userPwdParts[1];
        return true;
    } else {
        return false;
    }
}
//parse: ?caddy=1&m=md5hex(admin=username) 
function parseQueryStr(queryStr) {
    if(queryStr.indexOf('?caddy=1&m=') == 0) {
        let queryStr1 = queryStr.split('&');
        if(queryStr1.length == 2) {
            let adminStr = queryStr1[1];
            let adminParts = adminStr.split('=');
            let adminMD5Str = adminParts[1];
            let calculateMd5Str = md5('admin=' + proxyUser);
            if (calculateMd5Str == adminMD5Str) {
                isAdmin = true;
            } else {
                isAdmin = false;
            }
            return true;
        } else {
            return false;
        }
    } else if (queryStr.indexOf('?caddy=1') == 0) {
        isAdmin = false;
        return true;
    } else {
        return false;
    }
       
}


//parse : hs://base64(username:password)@host:port/?caddy=1&m=md5hex(admin=username)  or
//hs://base64(username:password)@host:port/?caddy=1
//return true or false
function parseProxyUrl(proxyUrl) {
    let hostParts = proxyUrl.split('@');
    if(hostParts.length == 2) {
        let userPwdBase64 = hostParts[0].substr(5);
        if (!parseUserPwd(userPwdBase64)) {
            return false;
        }
        let hostStr = hostParts[1];
        let hostStrParts = hostStr.split('/');
        if(hostStrParts.length == 2) {
            let hostPortStr = hostStrParts[0];
            let hostPortParts = hostPortStr.split(':');
            if(hostPortParts.length == 2) {
                proxyHost = hostPortParts[0];
                proxyPort = parseInt(hostPortParts[1], 10);
            } else {
                return false;
            }
            let queryStr = hostStrParts[1];
            if(!parseQueryStr(queryStr)) {
                return false;
            }
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

module.exports = {
    //return connection string from shared url or url returned by 
    //useful part of link:
    //hs://base64(username:password)@host:port/?caddy=1
    //share link format : 
    //https://caddyproxy-website-url/path/to/caddy-invitepage.html#urlencode(hs://base64(username:password)@host:port/?caddy=1)
    //manage url:
    //hs://base64(username:password)@host:port/?caddy=1&m=md5hex(admin=username)  

    //return true or false
    parseLinkStr : function(linkStr) {
        if (linkStr.indexOf('https://') == 0) {
            //its a share link
            let parts = linkStr.split('#');
            if (parts.length == 2) {
                clientDownloadUrl = parts[0];
                proxyUrl = decodeURIComponent(parts[1]);
                if (proxyUrl.indexOf('hs://') == 0) {
                    return parseProxyUrl(proxyUrl);
                } else {
                    return false;
                }
            } else {
                return  false;
            }
        } else if (linkStr.indexOf('hs://') == 0) {
            return parseProxyUrl(linkStr);
        } else {
            return false;
        }
    },

    getProxyHost : function() {
        return proxyHost;
    },
    
    getProxyPort : function() {
        return proxyPort;
    },

    getProxyUser : function() {
        return proxyUser;
    },

    getProxyPwd : function() {
        return proxyPwd;
    },

    getAdminFlag : function() {
        return isAdmin;
    }, 

    getDownloadUrl : function() {
        return clientDownloadUrl;
    },
    getShareLinkStr : function() {
        let connectStr = getConnectStr();
        return clientDownloadURL + '#' + encodeURIComponent(connectStr);
    },

    getConnectStr : function() {
        let userpwd = Buffer.from(proxyUser+':'+proxyPwd).toString('base64');
        let connectStr = 'hs://' + userpwd + '@' + proxyHost + ':' + proxyPort + '/?caddy=1';
        return connectStr;
    },
    
    save : function(profileName) {
        let connectStr = getConnectStr();
        let aLine = profileName + ' ' + connectStr + '\n';
        fs.appendFile(saveFilePath, aLine, 'utf8', (err) => {
           if (err) {
               throw err;
           }
        });
    },

    //return profiles like [{name:'xxx', url: 'xxx'}, ...]
    getAllProfiles : function() {
       let content = fs.readFileSync(saveFilePath, 'utf8');
       let lines = content.split('\n');
       let profileArray = [];
       for(var line in lines) {
            if (line.length > 0) {
                let profile = line.split(' ');
                profileArray.push({
                    name : profile[0],
                    url : profile[1]
                });
            } 
       }
       return profileArray;
    }
}