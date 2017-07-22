const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.js')
const request = require("request");
const songq = require('./modules/songqueue.js')
const notif = require('./modules/notifier.js')
const loyal = require('./modules/loyalty.js')

client.on('ready', function() {
  console.log('Yucicord ready for action');
  notif.youtube(client);
  notif.twitch(client);
  notif.twitter(client);
  loyal.points(client);
});

client.on('message', function(message) {
  if (message.content == '!ping') {
    message.reply('pong');
  }
  
  if (message.content == '!embed') {
    message.channel.send({embed: {
      color: Math.floor(Math.random() * 10000000),
      title: "Yucicord info",
      description: "Welcome to the server!",
      fields: [{
          name: "User stats",
          value: 'Users on server: ' + message.guild.members.map(function() {}).length + ' | Users online: '+ message.guild.presences.filter(function(value){return value.status == 'online'}).map(function() {}).length
        },
        {
          name: "Another field",
          value: "With some test text"
        }
      ],
      timestamp: new Date(),
      footer: {
        icon_url: client.user.avatarURL,
        text: "© Mstiekema | Yucicord "
      }
    }});
  }
  
  if (message.content == '!voice') {
    if (message.member.voiceChannel) {
      message.member.voiceChannel.join()
        .then(connection => {
          const ytdl = require('ytdl-core');
          const streamOptions = { seek: 0, volume: 1 };
          const stream = ytdl('https://www.youtube.com/watch?v=BeaNRbiiqGg', { filter : 'audioonly' });
          
          console.log("Connected to the voice channel")
          connection.playStream(stream);
        })
        .catch(console.log);
    } else {
      message.reply('You aren\'t in a voice channel');
    }
  }
  
  if (message.content == '!leave') {
    if (message.member.voiceChannel) {
      message.member.voiceChannel.leave()
    }
  }
  
  songq.sr(message);
});

client.login(config.token);