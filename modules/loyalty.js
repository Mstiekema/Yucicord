const request = require("request");
const db = require('./db.js').connection;
const activeUsers = new Array;

module.exports = {
  rewardPoints: function(client) {
    client.on('message', function(message) {
      var userInfo = {
        username: message.author.username,
        id: message.author.id
      }
      if(activeUsers.findIndex(i => i.username == message.author.username) != -1) return
      activeUsers.push(userInfo)
    })
    function addPoints(u, w) {
      db.query('select * from user where userId = ?', u.userId, function(err, result) {
        if(err) return console.log(err)
        if(!result[0]) {
          db.query('insert into user set ?', u, function(err, result) {})
        } else if(result[0].userId) {
          if(w) {db.query('update user set time = time + 5 where userId = ?', u.userId, function(err, result) {})}
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
            time: 0
          }
          var w = true;
          addPoints(userInfo, w)
        }
      }
    }, 30000);
    setInterval(function () {
      for (var i = 0; i <= activeUsers.length; i++) {
        if(i == activeUsers.length) return activeUsers.length = 0
        var userInfo = {
          name: activeUsers[i].username,
          userId: activeUsers[i].id,
          points: 0,
          time: 0
        }
        addPoints(userInfo)
      }
    }, 30000);
  },
  pointComms: function(c, message) {
    if(message.content.startsWith("!profile")) {
      db.query('SELECT points, time, z.rank FROM ( SELECT t.userId, t.points, t.time, @rownum := @rownum + 1 AS rank FROM user t, (SELECT @rownum := 0) r ORDER BY points DESC ) as z where userId = ?', message.author.id, function(err, result) {
        if(!result[0]) return message.reply("Je hebt op het moment nog geen punten")
        var points = result[0].points
        var timeT = result[0].time
        var timeA = (result[0].points - (result[0].time / 5)) * 5
        var timeStuffs = {
          "dag(en)": 24*60,
          "uur": 60,
          "minuten": 1
        }
        var totTime = new Array;
        var acTime = new Array;
        for(var name in timeStuffs) {
          var p =  Math.floor(timeT/timeStuffs[name]);
          if (p != 0) {
            totTime.push(" " + p + " " + name);
            timeT %= timeStuffs[name]
          }
        }
        for(var name in timeStuffs) {
          var p =  Math.floor(timeA/timeStuffs[name]);
          if (p != 0) {
            acTime.push(" " + p + " " + name);
            timeA %= timeStuffs[name]  
          }
        }
        var level = 1 + Math.floor(0.3456 * Math.sqrt(points))
        var pfornlvl = Math.floor(Math.pow(((level) / 0.3456), 2))
        var chan = message.channel
        var jD = new Date(message.member.guild.joinedTimestamp)
        var aD = new Date(message.author.createdTimestamp)
        var jy = jD.getFullYear(); var jm = jD.getMonth(); var jd = jD.getDate(); var jh = jD.getHours(); var jmi = jD.getMinutes(); var js = jD.getSeconds();
        var ay = aD.getFullYear(); var am = aD.getMonth(); var ad = aD.getDate(); var ah = jD.getHours(); var ami = aD.getMinutes(); var as = aD.getSeconds();
        const embed = {
          "color": 10181046,
          "author": {
            "name": message.author.username,
            "icon_url": message.author.avatarURL
          },
          "fields": [
            {
              "name": "Points",
              "value": points,
              "inline": true
            },
            {
              "name": "Level",
              "value": level + " (" + points + "/" + pfornlvl + ")",
              "inline": true
            },
            {
              "name": "Rank",
              "value": result[0].rank,
              "inline": true
            },
            {
              "name": "Tijd online",
              "value": "Online: "+totTime+"\nActief: "+acTime
            },
            {
              "name": "Account aangemaakt",
              "value": ad + "/" + am + "/" + ay + " om " + ah + ":" + ami + ":" + as
            },
            {
              "name": "Server gejoined",
              "value": jd + "/" + jm + "/" + jy + " om " + jh + ":" + jmi + ":" + js
            }
          ]
        };
        chan.send({embed}).then(m => setTimeout(function () {
          message.delete()
          m.delete()
        }, 20000))
      })
    }
    if(message.content.startsWith("!leaderboard")) {
      db.query('select * from user ORDER BY points DESC LIMIT 10', function(err, result) {
        var chan = message.channel
        var q = new Array;
        var desc = new String;
        for(var i = 0; i < result.length; i++) {
          var lvl = 1 + Math.floor(0.3456 * Math.sqrt(result[i].points))
          var pfornlvl = Math.floor(Math.pow(((lvl) / 0.3456), 2))
          var msg = {
            "name": "[" + (i+1) + "] " + result[i].name,
            "value": "Points: **" + result[i].points + "** | Level: **" + lvl + "** | Progress: **" + result[i].points + "**/**" + pfornlvl + "**"
          }
          q.push(msg)
        }
        const embed = {
          "color": 15158332,
          "title": "Top 10 users",
          "fields": q
        }
        chan.send({embed}).then(m => setTimeout(function () {
          message.delete()
          m.delete()
        }, 10000))
      })
    }
  }
}