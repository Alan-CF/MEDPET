import axios from "axios";
import config from "../config/env.js";

class WhatsAppService {
  async sendMessage(to, body, messageId) {
    try {
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to,
          text: { body },
          // context: {
          //   message_id: messageId,
          // },
        },
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  async markAsRead(messageId) {
    try {
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        },
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  }

  async sendInteractiveButtons(to, BodyText, buttons) {
    try {
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: BodyText },
            action: {
              buttons: buttons,
            },
          },
        },
      });
    } catch (e) {
      console.error(e);
    }
  }

  async sendMediaMessage(to, type, mediaUrl, caption) {
    try {
      const mediaObject = {};
      switch (type) {
        case "image":
          mediaObject.image = { link: mediaUrl, caption: caption };
          break;
        case "audio":
          mediaObject.audio = { link: mediaUrl };
          console.log("audio case");
          break;
        case "video":
          mediaObject.video = { link: mediaUrl, caption: caption };
          break;
        case "document":
          mediaObject.document = {
            link: mediaUrl,
            caption: caption,
            filename: "medpet.pdf",
          };
          break;
        case defaut:
          throw new Error("Not suported media type");
      }
      console.log("Retrieving ", type);
      const req = {
        method: "POST",
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to,
          type: type,
          ...mediaObject,
        },
      };

      console.log(req);
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to,
          type: type,
          ...mediaObject,
        },
      });
    } catch (e) {
      console.error("Error sending media", e);
    }
    console.log("Sent ", type);
  }

  async sendContactMessage(to, contact) {
    try {
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to,
          type: "contacts",
          contacts: [contact]
        }
      });
    } catch (e) {
      console.error(e)
    }
  }

  async sendLocationMessage(to, latitude, longitude, name, address) {
    try {
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to,
          type: "location",
          location: {
            latitude: latitude,
            longitude: longitude,
            name: name,
            address: address
          }
          
        },
      });
    } catch (e) {
      console.error(e);
    }
  }
}

export default new WhatsAppService();
