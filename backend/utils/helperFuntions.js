const generator = require("generate-password");

function generateRandomPassword() {
  //   password should contain atleast 1 uppercase, 1 lowercase, 1 number and 1 special character
  //npm i password-generator
  const password = generator.generate({
    length: 10,
    numbers: true,
    symbols: true,
    uppercase: true,
    // I only want @_!$. to be included
    exclude: '"#%&\'()+,/:;<=>?[\\]^`{|}~',
    strict: true,
  });
  console.log(password);
  return password;
}

module.exports = {
  generateRandomPassword,
};
