import whatsappService from './whatsappService.js';

const cleanPhoneNumber = (number) => {
  return number.startsWith('521') ? number.replace("521", "52") : number;
};

class MessageHandler {
  
  async handleIncomingMessage(message) {
    if (message?.type === 'text') {
      const response = `Echo: ${message.text.body}`;
      await whatsappService.sendMessage(cleanPhoneNumber(message.from), response, message.id);
      await whatsappService.markAsRead(message.id);
    }
  }
}

export default new MessageHandler();