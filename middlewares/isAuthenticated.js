const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  //   console.log("req.headers.authorization => ", req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).json("Unauthorized");
  }
  const token = req.headers.authorization.replace("Bearer ", "");
  //   console.log("token => ", token); //token => s9ucWWdjfiznzm5qzH-2GGyL4hyDxXG3hyhJVouPla3IN2imyBSGnewakN6njfLI
  const existingUser = await User.findOne({
    token: token,
  }); /*.select("email account)*/ // On peut à la fin rajouter un .select() pour n'avoir que le mail et le compte de l'utilisateur. L'effet ressemble à populate
  // console.log("USER=>", existingUser);
  if (!existingUser) {
    return res.status(401).json("Unauthorized");
  }
  req.user = existingUser;
  next();
};

module.exports = isAuthenticated;
