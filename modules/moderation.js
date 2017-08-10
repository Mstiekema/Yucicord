const config = require('../config.js');

module.exports = {
  link: function(client, message) {
    if(message.channel.name == "muziek") return
    if(message.member["_roles"][0]) return
    var urlReg = String(message.content).match(/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm)
    if(urlReg) {
      message.delete();
    }
  }
}
