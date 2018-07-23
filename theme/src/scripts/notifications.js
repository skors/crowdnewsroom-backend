import Noty from 'noty';

const success = (text) => {
    new Noty({text, timeout: 2000, type: "success"}).show();
};

export default {success};

