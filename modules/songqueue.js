const request = require("request");
const ytdl = require('ytdl-core');
const config = require('../config.js');
const db = require('./db.js').connection;
var currStream;
var conn;

function connToChan(c, message) {
  var chan = c.guilds.array()[1].channels.find('name', 'muziek')
  if (message.member.voiceChannel ) {
    message.member.voiceChannel.join()
    .then(connection => {
      conn = connection
      playSongInChannel(chan, message)
    })
    .catch(console.log);
  } else {
    message.reply("Je moet het muziek kanaal zitten voordat je de muziek kan starten ;)")
  }
}

function playSongInChannel(c, m) {
  db.query('select * from songrequest where playState = 0', function(err, result) {
    if(!result[0]) return m.reply("Er kan geen muziek worden afgespeeld als er geen muziek in de queue staat")
    const stream = ytdl('https://www.youtube.com/watch?v=' + result[0].songid, { filter : 'audioonly' });
    currStream = conn.playStream(stream, { seek: 0, volume: 1 });
    currStream.on('end', () => {
      db.query('select * from songrequest where playState = 0', function(err, result) {
        if(result[0]) db.query('update songrequest set playState = 1 where songid = ?', result[0].songid, function(err, result) {return})
        if(!result[1]) return c.send("Songqueue is nu leeg")
        playSongInChannel(c)
      })
    })
  })
}

module.exports = {
  sr: function (c, message) {
    if (message.content.startsWith('!sr')) {
      if(message.channel.name != "muziek") return
      var link = message.content.substring(4, message.content.length)
      var testIfLink = String(link).match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
      if (testIfLink != null) {
        getYTInfo(testIfLink[1], message)
      } else if (link.length == 11){
        getYTInfo(link, message)
      } else {
        var url = "https://www.googleapis.com/youtube/v3/search?part=id&q=" + link + "&key=" + config.ytApiKey
        request(url, function (error, response, body) {
          var id = JSON.parse(body).items[0].id.videoId
          getYTInfo(id, message)
        })
      }
      
      function getYTInfo(id, message) {
      	var url = "https://www.googleapis.com/youtube/v3/videos?id=" + id + "&key=" + config.ytApiKey + "%20&part=snippet,contentDetails,statistics,status"
      	request(url, function (error, response, body) {
          info = JSON.parse(body)
          if (info.items[0] == null) {
            	return message.reply("This isn't a valid YT video, plese try again")
          }
          base = info.items[0]
          var length = base.contentDetails.duration
          var reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
          var hours = 0, minutes = 0, seconds = 0, totalseconds;
          var matches = reptms.exec(length);
          if (matches[1]) hours = Number(matches[1]);
          if (matches[2]) minutes = Number(matches[2]);
          if (matches[3]) seconds = Number(matches[3]);
          totalseconds = Number(hours * 3600  + minutes * 60 + seconds);
          var title = base.snippet.title
          var songInfo = {
            title: base.snippet.title,
            thumb: base.snippet.thumbnails.default.url,
            name: message.author.username,
            length: totalseconds,
            songid: id
      		}
          db.query('insert into songrequest set ?', songInfo, function(err, result) {if (err) {return}})
      	}
      )}
    }
  },
  songComm: function(c, message) {
    if(message.channel.name != "muziek") return
    var chan = c.guilds.array()[1].channels.find('name', 'muziek')
    if(message.content.startsWith("!start")) {
      connToChan(c, message)
    }
    if(message.content.startsWith("!pause")) {
      if(!message.member["_roles"][0]) return
      if(!currStream) return
      if(!conn.speaking) return
      chan.send(":pause_button: Muziek is gepauzeerd")
      setTimeout(function () {
        message.delete()
        if(chan.messages.find('content', ":pause_button: Muziek is gepauzeerd")) chan.messages.find('content', ":pause_button: Muziek is gepauzeerd").delete()
      }, 7000);
      currStream.pause()
    }
    if(message.content.startsWith("!resume")) {
      if(!message.member["_roles"][0]) return
      if(!currStream) return
      if(conn.speaking) return
      chan.send(":play_pause: Muziek is hervat")
      setTimeout(function () {
        message.delete()
        if(chan.messages.find('content', ":play_pause: Muziek is hervat")) chan.messages.find('content', ":play_pause: Muziek is hervat").delete()
      }, 7000);
      currStream.resume()
    }
    if(message.content.startsWith("!skip")) {
      if(!message.member["_roles"][0]) return
      if(!currStream) return
      currStream = null
      db.query('select * from songrequest where playState = 0', function(err, result) {
        if(!result[0]) return chan.send("Songqueue is nu leeg")
        const stream = ytdl('https://www.youtube.com/watch?v=' + result[0].songid, { filter : 'audioonly' });
        currStream = conn.playStream(stream, { seek: 0, volume: 1 });
        chan.send("Huidig nummer is overgeslagen")
      })
    }
    if(message.content.startsWith("!np")) {
      db.query('select * from songrequest where playState = 0', function(err, result) {
        if (!result[0]) return chan.send("Er wordt op het moment geen muziek afgespeeld")
        chan.send("Op het moment wordt " + result[0].title + " afgespeeld. Dit nummer werd aangevraagd door " + result[0].name + " | https://www.youtube.com/watch?v=" + result[0].songid)
      })
    }
    if(message.content.startsWith("!q")) {
      db.query('select * from songrequest where playState = 0', function(err, result) {
        if (!result[0]) return chan.send("Er staat geen muziek in de queue")
        var q = new Array;
        var desc = new String;
        for(var i = 0; i < result.length; i++) {
          var time = Math.floor(result[i].length / 60) + ":" + Math.floor(result[i].length % 60)
          if (i == 0) {
            var msg = {
              "name": "[NOW PLAYING] " + result[i].title,
              "value": "Gerequest door: " + result[i].name + " | "+ time
            }
          } else {
            var msg = {
              "name": "[" + i + "] " + result[i].title,
              "value": "Gerequest door: " + result[i].name + " | "+ time
            }
          }
          q.push(msg)
        }
        const embed = {
          "color": 15158332,
          "timestamp": new Date(),
          "description": " ﱞ ",
          "author": {
            name: "Songqueue voor " + message.guild.name,
            "icon_url":  c.user.avatarURL
          },
          "fields": q
        }
        chan.send({embed})
      })
    }
    if(message.content.startsWith("!next")) {
      db.query('select * from songrequest where playState = 0', function(err, result) {
        if (!result[1]) return chan.send("Er wordt hierna geen muziek afgespeeld")
        chan.sen("Hierna wordt " + result[1].title + " afgespeeld. Dit nummer werd aangevraagd door " + result[1].name + " | https://www.youtube.com/watch?v=" + result[1].songid)
      })
    }
  }
}