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
  mod.link(message);
  mod.purge(message);
  if(message.content.startsWith("!help")) {
    var msg = "**Commands** \
``` \
!profile --> Zie je points en rank \n \
!leaderboard --> Top 10 gebruikers \n \
!sr [LINK] --> Voeg een nummer toe aan de queue \n \
!start --> Start de muziek, als je in een kanaal zit \n \
!q --> Zie welke muziek er in de queue / wachtrij staan \n \
!np --> Laat het nummer zien dat nu wordt afgespeeld \n \
!next --> Zie welk nummer komt na het huidige nummer \n \
!skip --> Stem op het skippen van een nummer \n \
!clear [GETAL] --> Verwijder x aantal messages uit een channel [MOD ONLY] \n \
!purge [USER] --> Verwijder berichten van een bepaalde gebruiker [MOD ONLY] \n \
!fskip --> Slaat een nummer over [MOD ONLY] \
```"
    message.channel.send(msg).then(m => setTimeout(function () {
      message.delete()
      m.delete()
    }, 15000))
  } 
});

client.login(config.keys.token);