import whatsappService from "./whatsappService.js";

const cleanPhoneNumber = (number) => {
  return number.startsWith("521") ? number.replace("521", "52") : number;
};

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    const senderNumber = message && cleanPhoneNumber(message.from);

    if (message?.type === "text") {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(senderNumber, message.id, senderInfo);
        await this.sendWelcomeMenu(senderNumber);
      } else if (["video", "audio", "foto", "pdf"].includes(incomingMessage)) {
        await this.sendMedia(senderNumber, incomingMessage);
      } else {
        const response = `Echo: ${message.text.body}`;
        await whatsappService.sendMessage(senderNumber, response, message.id);
      }

      await whatsappService.markAsRead(message.id);
    } else if (message?.type === "interactive") {
      const option = message?.interactive?.button_reply?.id;
      await this.handleMenuOption(senderNumber, option);
      await whatsappService.markAsRead(message.id);
    }
  }

  isGreeting(message) {
    const greetings = [
      "hola",
      "buenas tardes",
      "buenas",
      "que tal",
      "q onda",
      "wazaaaaaa",
    ];
    return greetings.includes(message);
  }

  getSenderName(senderInfo) {
    return senderInfo.profile?.name.split(" ")[0] || senderInfo.wa_id || "\b";
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const welcomeMessage = `Hola ${name}, bienvenido a nuestro servicio de veterinaria online. En que puedo ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to) {
    const menuMessage = "Elige una opción.";
    const buttons = [
      {
        type: "reply",
        reply: { id: "option_1", title: "Agendar" },
      },
      {
        type: "reply",
        reply: { id: "option_2", title: "Consultar" },
      },
      {
        type: "reply",
        reply: { id: "option_3", title: "Ubicación" },
      },
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option) {
    let response;
    switch (option) {
      case "option_1":
        response = "Agendando cita...";
        break;
      case "option_2":
        response = "Realiza tu consulta.";
        break;
      case "option_3":
        response = "Esta es nuestra ubicación.";
        break;
      default:
        response =
          "Lo siento, no entendí tu seleción, elige una de las opciónes del menu.";
    }
    await whatsappService.sendMessage(to, response);
  }

  async sendMedia(to, type) {
    const caption = `${type}!`;
    var mediaUrl;

    switch (type) {
      case "audio":
        mediaUrl = "https://petmed.s3.us-east-2.amazonaws.com/audio.aac";
        break;
      case "video":
        mediaUrl =
          "https://petmed.s3.us-east-2.amazonaws.com/Safety+Has+No+Shortcuts.mp4";
        break;
      case "foto":
        mediaUrl = "https://petmed.s3.us-east-2.amazonaws.com/image.jpg";
        type = "image";
        break;
      case "pdf":
        mediaUrl =
          "https://petmed.s3.us-east-2.amazonaws.com/Formato+del+archivo+bitacora.pdf";
        type = "document";
        break;
      default:
        console.error(type, "no es formato permitido.");
        break;
    }

    if (mediaUrl) {
      await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
    }
  }
}

export default new MessageHandler();
