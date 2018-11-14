module.exports = {
     MSG_TYPE_CONNECT : 'msg-type-connect', // {type: 'msg-type-connect', params: 'hs://xxxxx'}
     MSG_TYPE_DISCONNECT : 'msg-type-disconnect', // {type: 'msg-type-connect'}
     MSG_TYPE_CONNECT_RET : 'msg-type-connect-result', // {type:'msg-type-connect-result', code : 0/-1}
     buildMsg : function(msgType, param) {
         return {'type': msgType, 'param':param}
     },
     getMsgParam : function(msg) {
         return msg.param;
     }
}