module.exports = {
  capitalize: (input) => {
    if (input) {
      const name = input.toLowerCase();
      return name.charAt(0).toUpperCase() + name.slice(1);
    } else {
      return null;
    }
  },

  capitalizeEveryWord: (input) => {
    if (input) {
      var words = input.split(" ");
      var CapitalizedWords = [];
      words.forEach((element) => {
        CapitalizedWords.push(
          element[0].toUpperCase() + element.slice(1, element.length)
        );
      });
      return CapitalizedWords.join(" ");
    } else {
      return null;
    }
  },

  lowercase: (input) => {
    if (input) {
      return input.toLowerCase();
    } else {
      return null;
    }
  },
  uppercase: (input) => {
    if (input) {
      return input.toUpperCase();
    } else {
      return null;
    }
  },
};
