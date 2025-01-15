import axios from "axios";
import config from "../../config/env.js";

const sendToWhatsApp = async (data) => {
  const baseUrl = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
  const headers = {
    authorization: `Bearer ${config.API_TOKEN}`
  };

  try {
    const response = await axios({
      method: "POST",
      url: baseUrl,
      headers: headers,
      data
    })
    return response.datal;
  } catch (e) {
    console.error(e);
  }
};

export default sendToWhatsApp;