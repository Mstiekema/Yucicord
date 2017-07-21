const request = require("request");
const config = require('../config.js');
const db = require('./db.js').connection;

module.exports = {
  sr: function (message) {
    if (message.content.startsWith('!sr')) {
      if (message.member.voiceChannel) {
        message.member.voiceChannel.join()
        .then(connection => {
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
              if(connection.speaking) return console.log("Added to queue")
              playSongInChannel(id)
      			}
      		)}

          function playSongInChannel(id) {
            const ytdl = require('ytdl-core');
            const streamOptions = { seek: 0, volume: 1 };
            const stream = ytdl('https://www.youtube.com/watch?v=' + id, { filter : 'audioonly' });
            const currStream = connection.playStream(stream, streamOptions);
            currStream.on('end', () => {
              db.query('select * from songrequest where playState = 0', function(err, result) {
                db.query('update songrequest set playState = 1 where songid = ?', result[0].songid, function(err, result) {return})
                if(!result[1]) return message.channel.send("Songqueue is now empty")
                playSongInChannel(result[1].songid)
              })
            })
          }
        })
        .catch(console.log);
      } else {
        message.reply('You aren\'t in a voice channel');
      }
    }
  }
}