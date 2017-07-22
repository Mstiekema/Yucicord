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
  if (message.content == '!serverinfo') {
    console.log(message)
    message.channel.send({embed: {
      color: Math.floor(Math.random() * 10000000),
      "author": {
        "name": message.guild.name,
        "icon_url": message.guild.icon
      },
      description: 'Users on server: ' + message.guild.members.map(function() {}).length + ' | Users online: '+ message.guild.presences.filter(function(value){return value.status == 'online'}).map(function() {}).length,
      timestamp: new Date(),
      footer: {
        icon_url: client.user.avatarURL,
        text: "© Mstiekema | Yucicord "
      }
    }});
  }
  songq.sr(message);
});

client.login(config.token);