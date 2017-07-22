const request = require("request");
const config = require('../config.js');
const db = require('./db.js').connection;
const activeUsers = new Array;

module.exports = {
  points: function(client) {
    client.on('message', function(message) {
      var userInfo = {
        username: message.author.username,
        id: message.author.id
      }
      if(activeUsers.findIndex(i => i.username == message.author.username) != -1) return
      activeUsers.push(userInfo)
    })
    function addPoints(u) {
      db.query('select * from user where userId = ?', u.userId, function(err, result) {
        if(err) return console.log(err)
        if(!result[0]) {
          db.query('insert into user set ?', u, function(err, result) {})
        } else if(result[0].userId) {
          db.query('update user set points = points + 1 where userId = ?', u.userId, function(err, result) {})
        }
      })
    }
    setInterval(function () {
      var base = client.guilds.array()[0].members.array()
      var ids = base[0].guild.presences.keyArray()
      var allStats = base[0].guild.presences.map(function(x) {return x.status})
      for (var i = 0; i < base.length; i++) {
        var j = ids.indexOf(base[i].user.id)
        if(j != -1 && allStats[j] != 'offline') {
          var userInfo = {
            name: base[i].user.username,
            userId: base[i].user.id,
            points: 0,
            level: 0
          }
          addPoints(userInfo)
        }
      }
    }, 300000);
    setInterval(function () {
      console.log(activeUsers)
      for (var i = 0; i <= activeUsers.length; i++) {
        if(i == activeUsers.length) return activeUsers.length = 0
        var userInfo = {
          name: activeUsers[i].username,
          userId: activeUsers[i].id,
          points: 0,
          level: 0
        }
        addPoints(userInfo)
      }
    }, 300000);
  }
}