export const setLocalStorage = (name, data) => {
  localStorage.setItem(name, data);
};

export const getLocalStorage = (name) => {
  var data = localStorage.getItem(name);
  return data;
};

export const removeLocalStorage = (name) => {
  localStorage.removeItem(name);
};
