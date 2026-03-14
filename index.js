
require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, AuditLogEvent } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ⚠️ TOKENは.envなどから読み込む
const TOKEN = process.env.TOKEN;

// ログチャンネルID
const LOG_CHANNEL = "1481278589067333834";

client.once('ready', () => {
  console.log(`ログイン成功: ${client.user.tag}`);
});

client.on('guildMemberRemove', async member => {

  const channel = member.guild.channels.cache.get(LOG_CHANNEL);
  if (!channel) return;

  let action = "leave";
  let executor = null;

  setTimeout(async () => {

    try {

      // BANチェック
      const banLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd
      });

      const banEntry = banLogs.entries.first();

      if (banEntry && banEntry.target.id === member.id) {
        action = "ban";
        executor = banEntry.executor;
      }

      // Kickチェック
      const kickLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberKick
      });

      const kickEntry = kickLogs.entries.first();

      if (kickEntry && kickEntry.target.id === member.id) {
        action = "kick";
        executor = kickEntry.executor;
      }

    } catch (err) {
      console.log("監査ログ取得エラー:", err);
    }

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    if (action === "ban") {

      embed
        .setTitle("🔨 メンバーBAN")
        .setDescription(
          `${member.user.tag} が **${executor ? executor.tag : "不明"}** にBANされました`
        );

    }

    else if (action === "kick") {

      embed
        .setTitle("👢 メンバーキック")
        .setDescription(
          `${member.user.tag} が **${executor ? executor.tag : "不明"}** にキックされました`
        );

    }

    else {

      embed
        .setTitle("🚪 メンバー脱退")
        .setDescription(
          `${member.user.tag} がサーバーを脱退しました`
        );

    }

    try {
      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.log("メッセージ送信エラー:", err);
    }

  }, 3000);

});

client.login(TOKEN);