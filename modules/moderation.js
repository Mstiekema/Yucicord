const config = require('../config.js');

module.exports = {
  purge: function(client, message) {
    var msg = message.content.split(" ")
    if(!message.member.hasPermission("MANAGE_MESSAGES")) return
    if(msg[0] == "!purge" && message.content != "!purge") {
      var nMsg = msg[1]
      var msgC = "Deleted " + nMsg + " messages."
      if(nMsg > 100) return message.reply("het maximale aantal berichten die je kan verwijderen is 100.")
      message.channel.bulkDelete(nMsg)
      message.channel.send(msgC)
      setTimeout(function () {
        if(message.channel.messages.find('content', msgC)) message.channel.messages.find('content', msgC).delete()
      }, 3000);
    }
    if(msg[0] == "!clear" && message.content != "!clear") {
      var m = message.channel.messages
      var usr = msg[1]
      var delMsgs = m.filter(function(u){if(u.author.username.toUpperCase() == usr.toUpperCase()) return u})
      message.channel.bulkDelete(delMsgs)
    }
  },
  link: function(client, message) {
    if(message.channel.name == "muziek") return
    if(message.member["_roles"][0]) return
    var urlReg = String(message.content).match(/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm)
    if(urlReg) {
      message.delete();
    }
  }
}