import Noty from 'noty';

const notificationFactory = (notificationType) => {
  return (text) => {
    new Noty({text, timeout: 2000, type: notificationType}).show();
  }
}

const success = notificationFactory("success");
const error = notificationFactory("error");

export default {success, error};

