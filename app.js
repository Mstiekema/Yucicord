const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.js')

client.on('message', function(message) {
  if (message.content == '!ping') {
    message.reply('pong');
  }
});

client.login(config.token);
