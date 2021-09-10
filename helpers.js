const getUserByEmail = function (email, database) {

  for (let key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }


};

module.exports = { getUserByEmail };

