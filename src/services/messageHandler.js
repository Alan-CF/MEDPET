import whatsappService from "./whatsappService.js";
import appendToSheet from "./googleSheetsService.js";
import openAiService from "./openAiService.js";

const cleanPhoneNumber = (number) => {
  return number.startsWith("521") ? number.replace("521", "52") : number;
};

class MessageHandler {
  constructor() {
    this.appointmentState = {};
    this.assistantState = {};
  }

  async handleIncomingMessage(message, senderInfo) {
    const senderNumber = message && cleanPhoneNumber(message.from);

    if (message?.type === "text") {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(senderNumber, message.id, senderInfo);
        await this.sendWelcomeMenu(senderNumber);
      } else if (["video", "audio", "foto", "pdf"].includes(incomingMessage)) {
        await this.sendMedia(senderNumber, incomingMessage);
      } else if (this.appointmentState[senderNumber]) {
        await this.handleApointmentFlow(senderNumber, incomingMessage);
      } else if (this.assistantState[senderNumber]) {
        await this.handleAssistantFlow(senderNumber, incomingMessage);
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
      { type: "reply", reply: { id: "option_1", title: "Agendar" } },
      { type: "reply", reply: { id: "option_2", title: "Consultar" } },
      { type: "reply", reply: { id: "option_3", title: "Ubicación" } }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option) {
    let response;
    switch (option) {
      case "option_1":  // Agendar
        this.appointmentState[to] = { step: "name" };
        response = "Por favor ingresa tu nombre.";
        break;
      case "option_2":  // Consultar
        this.assistantState[to] = { step: 'question' };
        response = "Realiza tu consulta.";
        break;
      case "option_3":  // ubicacion
        response = "Te esperamos en nuestra sucursal.";
        await this.sendLocation(to);
        break;
      case "option_4":  // Consultar/Si, Gracias
        response = "Me alegra escucharlo.";
        break;
      case "option_5":  // Consultar/Otra pregunta
        this.assistantState[to] = { step: 'question' };
        response = "Esta es nuestra ubicación.";
        break;
      case "option_6":  // // Consultar/Emergencia
        response = "Si esto es una emerencia te invitamos a llamar a nuestra linea de atencion.";
        await this.sendContact(to);
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

  completeAppointment(to) {
    const appointment = this.appointmentState[to];
    delete this.appointmentState[to];

    //Guardar en base de datos.
    const userData = [
      to,
      appointment.name,
      appointment.petName,
      appointment.petType,
      appointment.reason,
      appointment.time,
    ];

    appendToSheet(userData);

    return `Gracias por agendar una cita con nosotros ${appointment.name}. Estaremos atendiendo a ${appointment.petName}, a las ${appointment.time}, por el motivo: ${appointment.reason}.`;
  }

  async handleApointmentFlow(to, message) {
    const state = this.appointmentState[to];
    let response;

    switch (state.step) {
      case "name":
        state.name = message;
        state.step = "petName";
        response = "Gracias. Ahora, ¿Cual es el nombre de tu mascota?";
        break;
      case "petName":
        state.petName = message;
        state.step = "petType";
        response = "¿Que tipo de mascota es?";
        break;
      case "petType":
        state.petType = message;
        state.step = "reason";
        response = "¿Cual es el motivo de su consulta?";
        break;
      case "reason":
        state.reason = message;
        state.step = "time";
        response = "¿A que hora deseas agendar tu cita? (DD-MM hh:mm)";
        break;
      case "time":
        state.time = message;
        response = this.completeAppointment(to);
        break;
    }
    console.log(this.appointmentState[to]);
    await whatsappService.sendMessage(to, response);
  }

  async handleAssistantFlow(to, message) {
    const state = this.assistantState[to];
    let response;
 
    const menuMessage = "La respuesta fue de tu ayuda?";
    const buttons = [
      { type: "reply", reply: { id: "option_4", title: "Si, Gracias" } },
      { type: "reply", reply: { id: "option_5", title: "Hacer otra pregunta" } },
      { type: "reply", reply: { id: "option_6", title: "Emergencia" } },
    ];

    if (state.step === "question") {
      response = await openAiService(message);
    }

    delete this.assistantState[to];
    await whatsappService.sendMessage(to, response);
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async sendContact(to) {
    const contact = {
      addresses: [
        {
          street: "123 Calle de las Mascotas",
          city: "Ciudad",
          state: "Estado",
          zip: "12345",
          country: "País",
          country_code: "PA",
          type: "WORK"
        }
      ],
      emails: [
        {
          email: "contacto@medpet.com",
          type: "WORK"
        }
      ],
      name: {
        formatted_name: "MedPet Contacto",
        first_name: "MedPet",
        last_name: "Contacto",
        middle_name: "",
        suffix: "",
        prefix: ""
      },
      org: {
        company: "MedPet",
        department: "Atención al Cliente",
        title: "Representante"
      },
      phones: [
        {
          phone: "+1234567890",
          wa_id: "1234567890",
          type: "WORK"
        }
      ],
      urls: [
        {
          url: "https://www.medpet.com",
          type: "WORK"
        }
      ]
    };

    await whatsappService.sendContactMessage(to, contact);
  }

  async sendLocation(to) {
    const latitud = 6.2071694;
    const longitud = -75.574607;
    const name = "Plaza Medellin";
    const address = "Cra. 43A #5A - 113, El poblado, Medellin, Antioquia.";

    await whatsappService.sendLocationMessage(to, latitud, longitud, name, address);
  }
}

export default new MessageHandler();
