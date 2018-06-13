const authorizedFetch = (url, settings) => fetch(url, Object.assign({credentials: 'same-origin'}, settings)).then(response => response.json());

const authorizedPUT = (url, settings) => {
  const csrfValue = document.cookie.split(';').find(c => c.indexOf("csrftoken") === 0).split("=")[1];
  const baseSettings = {
    method: "PATCH",
    headers: {
      'content-type': 'application/json',
      'X-CSRFToken': csrfValue,
    },
  };
  return authorizedFetch(url, Object.assign(baseSettings, settings));
};


export {authorizedFetch,
authorizedPUT}
