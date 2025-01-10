const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { exec } = require("child_process");

module.exports = {
  pattern: "install",
  desc: "Install a plugin from a given URL",
  category: "utility",
  filename: __filename,
  use: "<plugin_url>",

  async onMessage(message, match) {
    try {
      // Vérifier si un lien a été fourni
      if (!match || !match.startsWith("http")) {
        return message.reply(
          "*Please provide a valid plugin URL.*\n\nExample: `.install https://example.com/plugin.js`"
        );
      }

      const pluginUrl = match.trim();
      const pluginName = pluginUrl.split("/").pop();

      if (!pluginName.endsWith(".js")) {
        return message.reply("*The plugin URL must point to a .js file.*");
      }

      const pluginsDir = path.join(__dirname, "plugins");
      const pluginPath = path.join(pluginsDir, pluginName);

      // Télécharger le fichier plugin
      const response = await axios.get(pluginUrl, { responseType: "stream" });

      // Écrire le fichier dans le dossier des commandes
      const writer = fs.createWriteStream(pluginPath);
      response.data.pipe(writer);

      writer.on("finish", async () => {
        // Vérifier si le fichier a été téléchargé avec succès
        if (fs.existsSync(pluginPath)) {
          await message.reply(
            `*Plugin installed successfully!*\n\nFilename: ${pluginName}\nRestarting the bot to activate the plugin...`
          );

          // Redémarrage automatique du bot
          exec("pm2 restart bot", (err, stdout, stderr) => {
            if (err) {
              console.error(`Error restarting bot: ${err.message}`);
              return message.reply(
                "*Plugin installed, but failed to restart the bot.*"
              );
            }
            console.log("Bot restarted successfully.");
          });
        } else {
          message.reply("*Failed to save the plugin file.*");
        }
      });

      writer.on("error", (err) => {
        console.error(err);
        message.reply("*An error occurred while saving the plugin.*");
      });
    } catch (err) {
      console.error(err);
      message.reply(`*Error installing the plugin:*\n\n${err.message}`);
    }
  },
};