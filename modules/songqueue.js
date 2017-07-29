const request = require("request");
const ytdl = require('ytdl-core');
const config = require('../config.js');
const db = require('./db.js').connection;
var skipUsrs = new Array;
var currStream;
var conn;

module.exports = {
  sr: function (c, message) {
    if(message.channel.name != "muziek") return
    var chan = c.guilds.array()[0].channels.find('name', 'muziek')
    
    function connToChan(c, message) {
      if (message.member.voiceChannel ) {
        message.member.voiceChannel.join()
        .then(connection => {
          conn = connection
          playSongInChannel(chan, message)
        })
        .catch(console.log);
      } else {
        message.reply("Je moet in het muziek kanaal zitten voordat je de muziek kan starten ;)")
      }
    }
    
    function playSongInChannel(c, m) {
      db.query('select * from songrequest where playState = 0', function(err, result) {
        if(!result[0]) return m.reply("Er kan geen muziek worden afgespeeld als er geen muziek in de queue staat")
        skipUsrs.length = 0
        const stream = ytdl('https://www.youtube.com/watch?v=' + result[0].songid, { filter : 'audioonly' });
        currStream = conn.playStream(stream, { seek: 0, volume: 1 });
        currStream.on('end', () => {
          db.query('select * from songrequest where playState = 0', function(err, result) {
            if(result[0]) db.query('update songrequest set playState = 1 where songid = ?', result[0].songid, function(err, result) {return})
            if(!result[1]) return c.send("Songqueue is nu leeg")
            playSongInChannel(c, m)
          })
        })
      })
    }
    
    if (message.content.startsWith('!sr')) {
      if(message.content == '!sr') return
      var link = message.content.substring(4, message.content.length)
      var testIfLink = String(link).match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
      if (testIfLink != null) {
        getYTInfo(testIfLink[1], message, c)
      } else if (link.length == 11){
        getYTInfo(link, message, c)
      } else {
        var url = "https://www.googleapis.com/youtube/v3/search?part=id&q=" + link + "&key=" + config.ytApiKey
        request(url, function (error, response, body) {
          var id = JSON.parse(body).items[0].id.videoId
          getYTInfo(id, message, c)
        })
      }
      
      function getYTInfo(id, message, c) {
      	var url = "https://www.googleapis.com/youtube/v3/videos?id=" + id + "&key=" + config.ytApiKey + "%20&part=snippet,contentDetails,statistics,status"
      	request(url, function (error, response, body) {
          info = JSON.parse(body)
          if (info.items[0] == null) {
            	return message.reply("This isn't a valid YT video, please try again")
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
          
          if(songInfo.length > 660) return message.reply("Je mag niet nummers aanvragen die langer zijn dan 11 minuten.")
          
          db.query('select * from songrequest where playState = 0', function(err, result) {
            var allSongs = result.map(function(x) {return x.title})
            var allUsers = result.map(function(x) {return x.name})
            var userTimes = allUsers.filter(function(b) {return b == message.author.username;})
            var uLength = userTimes.length
            if(allSongs.indexOf(songInfo.title) != -1) {
              return message.reply("Dit nummer staat al in de queue")
            } else if(uLength > 3) {
              return message.reply("Je hebt teveel nummers in de queue staan, wacht een tijdje voordat je meer liedjes toegevoegd.")
            } else {
              db.query('insert into songrequest set ?', songInfo, function(err, result) {if (err) {return}})
              message.reply("Succesvol '" + songInfo.title + "' toegevoegd aan de queue!")
              if (message.member.voiceChannel ) {
                if(conn && conn.speaking) return
                message.member.voiceChannel.join()
                .then(connection => {
                  conn = connection
                  playSongInChannel(chan, message)
                })
                .catch(console.log);
              }
            }
          })
      	}
      )}
    }
    
    if(message.content.startsWith("!start")) {
      if(conn) return
      connToChan(c, message)
      chan.send(":arrow_forward: Muziek is gestart")
      setTimeout(function () {
        message.delete()
        if(chan.messages.find('content', ":arrow_forward: Muziek is gestart")) chan.messages.find('content', ":arrow_forward: Muziek is gestart").delete()
      }, 4000);
    }
    
    if(message.content.startsWith("!pause")) {
      if(!message.member["_roles"][0]) return
      if(!currStream) return
      if(!conn.speaking) return
      chan.send(":pause_button: Muziek is gepauzeerd")
      setTimeout(function () {
        message.delete()
        if(chan.messages.find('content', ":pause_button: Muziek is gepauzeerd")) chan.messages.find('content', ":pause_button: Muziek is gepauzeerd").delete()
      }, 5000);
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
      }, 5000);
      currStream.resume()
    }
    
    if(message.content.startsWith("!skip")) {
      if(message.member["_roles"][0]) {
        doSkip()
      } else {
        var usrs = conn.channel.members.array().length
        var usrsNeeded;
        if (usrs < 4) usrsNeeded = 1;
        if (usrs == 4 || usrs == 5) usrsNeeded = 2;
        if (usrs == 6 || usrs == 7) usrsNeeded = 3;
        if (usrs == 8 || usrs == 9) usrsNeeded = 4;
        if (usrs > 9) usrsNeeded = 5;
        if (skipUsrs.indexOf(message.author.username) == -1) {
          skipUsrs.push(message.author.username)
          if(skipUsrs.length >= usrsNeeded) {
            doSkip()
          } else {
            chan.send("Vote skip (" + skipUsrs.length + "/" + usrsNeeded + ")")
          }
        } else {
          message.reply("Je kan niet meerdere keren stemmen om te skippen")
        }
      }
      function doSkip() {
        if(!currStream) return
        currStream = null
        skipUsrs.length = 0
        db.query('select * from songrequest where playState = 0', function(err, result) {
          if(!result[1]) return chan.send("Songqueue is nu leeg")
          const stream = ytdl('https://www.youtube.com/watch?v=' + result[0].songid, { filter : 'audioonly' });
          currStream = conn.playStream(stream, { seek: 0, volume: 1 });
          chan.send(":fast_forward: Huidig nummer is overgeslagen")
          setTimeout(function () {
            message.delete()
            if(chan.messages.find('content', ":fast_forward: Huidig nummer is overgeslagen")) chan.messages.find('content', ":fast_forward: Huidig nummer is overgeslagen").delete()
          }, 5000);
        })  
      }
    }
    
    if(message.content.startsWith("!np")) {
      db.query('select * from songrequest where playState = 0', function(err, result) {
        if (!result[0]) return
        var msg = "Op het moment wordt " + result[0].title + " afgespeeld. Dit nummer werd aangevraagd door " + result[0].name + " | https://www.youtube.com/watch?v=" + result[0].songid
        chan.send(msg)
        setTimeout(function () {
          message.delete()
          if(chan.messages.find('content', msg)) chan.messages.find('content', msg).delete()
        }, 5000);
      })
    }
    
    if(message.content.startsWith("!q")) {
      db.query('select * from songrequest where playState = 0', function(err, result) {
        if (!result[0]) {
          chan.send("Er staat geen muziek in de queue")
          setTimeout(function () {
            message.delete()
            if(chan.messages.find('content', "Er staat geen muziek in de queue")) chan.messages.find('content', "Er staat geen muziek in de queue").delete()
          }, 5000);
          return
        }
        var q = new Array;
        var desc = new String;
        for(var i = 0; i < result.length; i++) {
          var time = Math.floor(result[i].length / 60) + ":" + Math.floor(result[i].length % 60)
          if (i == 0) {
            var msg = {
              "name": "[NOW PLAYING] " + result[i].title,
              "value": "Gerequest door: " + result[i].name + " | "+ time
            }
          } else if (i == 10) {
            return
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
          "description": "Queue length: "+result.length+" nummers. \n ﱞ ",
          "author": {
            name: "Songqueue voor " + message.guild.name,
            "icon_url":  c.user.avatarURL
          },
          "fields": q
        }
        chan.send({embed})
        setTimeout(function () {
          message.delete()
          if(chan.messages.find('content', '')) chan.messages.find('content', '').delete()
        }, 10000);
      })
    }
    if(message.content.startsWith("!next")) {
      db.query('select * from songrequest where playState = 0', function(err, result) {
        if (!result[1]) return chan.send("Er wordt hierna geen muziek afgespeeld")
        chan.send("Hierna wordt " + result[1].title + " afgespeeld. Dit nummer werd aangevraagd door " + result[1].name + " | https://www.youtube.com/watch?v=" + result[1].songid)
      })
    }
    
    if(message.content.startsWith("!shelp")) {
      var msg = "**Songbot commands** \
``` \
!sr LINK --> Voeg een nummer toe aan de queue \n \
!start --> Start de muziek, als je in een kanaal zit \n \
!q --> Zie welke muziek er in de queue / wachtrij staan \n \
!np --> Laat het nummer zien dat nu wordt afgespeeld \n \
!next --> Zie welk nummer komt na het huidige nummer \n \
!skip --> Slaat het nummer over dat nu wordt afgespeeld [MOD ONLY] \
```"
      chan.send(msg)
      setTimeout(function () {
        message.delete()
        if(chan.messages.find('content', msg)) chan.messages.find('content', msg).delete()
      }, 10000);
    }    
  }
}