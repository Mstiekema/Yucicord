const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.js')
const request = require("request");
const songq = require('./modules/songqueue.js')
const notif = require('./modules/notifier.js')
const loyal = require('./modules/loyalty.js')
const mod = require('./modules/moderation.js')

client.on('ready', function() {
  console.log('Yucicord ready for action');
  notif.youtube(client);
  notif.twitch(client);
  notif.twitter(client);
  loyal.rewardPoints(client);
});

client.on('message', function(message) {
  songq.sr(client, message);
  loyal.pointComms(client, message);
  mod.link(client, message);
  mod.purge(client, message);
});

client.login(config.token);