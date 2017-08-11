const request = require("request");
const Twitter = require('twitter');
const config = require('../config.js');
var lastvid = new Array;
var streamLive = new Array;
var msg = "@everyone De stream is nu live! Kom ook kijken op https://www.twitch.tv/" + config.info.streamerName

module.exports = {
  twitch: function (c) {
    var chan = c.guilds.find("name", config.info.serverName).channels.find('name', 'mededelingen')
    setInterval(function () {
      var info = {
        url: 'https://api.twitch.tv/kraken/streams/' + config.info.twitchId,
        headers: {
          'Accept': 'application/vnd.twitchtv.v5+json',
          'Client-ID': config.keys.clientID
        }
      }
      request(info, function (error, response, body) {
        if(body == undefined) return
        body = JSON.parse(body)
        
        if(!streamLive[0]) {
          if (body.stream != null) {
            streamLive[0] = "LIVE"
          } else {
            streamLive[0] = "OFFLINE"
          }
        }
        
        if (body.stream != null) {
          var b = new Date(body.stream["created_at"]);
          var n = new Date();
          var since = parseInt(b.getTime())
          var now = parseInt(n.getTime())
          var t = new Date(now - since);
          var pTime = new String()
          if(Math.floor(t.getUTCDate() - 1) != 0) {
            var d = Math.floor(t.getUTCDate() - 1)
            pTime += d + " days  "
          }
          if(Math.floor(t.getUTCHours()) != 0) {
            var h = Math.floor(t.getUTCHours()); 
            pTime += h + " h "
          }
          if(Math.floor(t.getUTCMinutes()) != 0) {
            var mi = Math.floor(t.getUTCMinutes()); 
            pTime += mi + " min "
          }
          const embed = {
            "color": 10181046,
            "image": {
              "url": body.stream.channel.logo
            },
            "author": {
              "name": body.stream.channel["display_name"],
              "url": "https://www.twitch.tv/"+body.stream.channel["display_name"],
              "icon_url": body.stream.channel.logo
            },
            "fields": [
              {
                "name": "Titel",
                "value": body.stream.channel.status
              },
              {
                "name": "Huidige game",
                "value": body.stream.game
              },
              {
                "name": "Viewers",
                "value": body.stream.viewers,
                "inline": true
              },
              {
                "name": "Followers",
                "value": body.stream.channel.followers,
                "inline": true
              },
              {
                "name": "Uptime",
                "value": pTime,
                "inline": true
              }
            ]
          };          
          
          if(streamLive[0] == "OFFLINE") {
            streamLive[0] = "LIVE"
            chan.send(msg, { embed });
            console.log("THE STREAM IS NOW LIVE FeelsGoodMan")
          } else {
            if(chan.messages.find('content', msg)) chan.messages.find('content', msg).edit(msg, { embed });
          }
        }
        
        if (body.stream == null && streamLive[0] == "LIVE") {
          streamLive[0] = "OFFLINE"
          if(chan.messages.find('content', msg)) chan.messages.find('content', msg).delete()
          console.log("THE STREAM IS NOW OFFLINE FeelsBadMan")
        }
      })
    }, 60000);
  },
  youtube: function (c) {
    var chan = c.guilds.find("name", config.info.serverName).channels.find('name', 'mededelingen')
    setInterval(function () {
      request("https://www.googleapis.com/youtube/v3/search?part=snippet&channelId="+config.info.ytId+"&maxResults=10&order=date&type=video&key="+config.keys.ytApiKey, 
      function (error, response, body, channel) {
        body = JSON.parse(body)
        
        if(!lastvid[0]) {
          lastvid[0] = body.items[0].id.videoId
          lastvid[1] = Math.round(new Date(body.items[0].snippet.publishedAt).getTime() / 1000);
          return
        }
        
        if(lastvid[0] != body.items[0].id.videoId && (Math.round(new Date(body.items[0].snippet.publishedAt).getTime() / 1000) - lastvid[1] > 0)) {
          console.log("NEW VIDEO")
          chan.send("@everyone Nieuwe video staat online! '" + body.items[0].snippet.title + "' https://www.youtube.com/watch?v=" +  body.items[0].id.videoId)
          lastvid[0] = body.items[0].id.videoId
        }
      })
    }, 60000);
  },
  twitter: function (c) {
    var chan = c.guilds.find("name", config.info.serverName).channels.find('name', 'twitter-feed')
    var client = new Twitter({
      consumer_key: config.keys.key,
      consumer_secret: config.keys.secret,
      access_token_key: config.keys.accKey,
      access_token_secret: config.keys.accSecret
    });
    
    client.stream('statuses/filter', {'follow': config.info.twitterUsrs.join(",")}, function(stream) {
      stream.on('data', function(event) {
        if(config.info.twitterUsrs.indexOf(event.user.id) == -1) return
        if(event.text.startsWith("@")) return
        const embed = {
          "color": 3447003,
          "author": {
            "name": event.user["name"],
            "url": "https://www.twitter.com/"+event.user["screen_name"]+"/status/"+event.id,
            "icon_url": event.user["profile_image_url"]
          },
          "fields": [
            {
              "name": "Tweet",
              "value": event.text
            }
          ]
        };  
        
        chan.send({ embed })
      });
      
      stream.on('error', function(error) {
        throw error;
      });
    });
  },
}