module.exports = {
  say: function(message) {
    var msg = message.content.split(" ")
    if(!message.member) return
    if(!message.member.hasPermission("MANAGE_MESSAGES")) return
    if(msg[0] == "!say" && message.content != "!say") {
      msg.shift();
      message.delete();
      message.channel.send(msg.join(" "));
    }
  }
}
