const express = require("express");

const User = require("../models/User");

const router = express.Router();

const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

router.post("/user/signup", async (req, res) => {
  try {
    // console.log(req.body); // {  username: 'JohnDoe',  email: 'johndoe@lereacteur.io',  password: 'azerty',  newsletter: true}

    const user = await User.findOne({ email: req.body.email });

    if (user) {
      return res.status(401).json({ message: "Email already taken" });
    }
    const salt = uid2(16);
    // console.log("salt => ", salt);

    const hash = SHA256(req.body.password + salt).toString(encBase64);
    // console.log("hash => ", hash);

    const token = uid2(64);
    // console.log("token => ", token);

    const newUser = new User({
      account: {
        username: req.body.username,
      },
      email: req.body.email,
      newsletter: req.body.newsletter,
      token: token,
      salt: salt,
      hash: hash,
    });
    // console.log(newUser); // Me renvoie l'objet newUser ds son intégralité + l'id.
    await newUser.save();
    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: newUser.account,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // console.log(req.body.email); // johndoe@lereacteur.io

    const user = await User.findOne({ email: req.body.email });
    // console.log(user); // Affiche le tableau de l'user ds son intégralité.
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // console.log(user.salt); // 1Yhpd0z-u_DivZ8j
    const password = req.body.password;
    // console.log(password); // azerty

    const hash2 = SHA256(password + user.salt).toString(encBase64);
    // Si hash est différent de user.hash alors le mdp n'est pas bon => Unauthorized
    // Si MDP + user.salt != user.hash
    if (hash2 !== user.hash) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.status(200).json({
      _id: user._id,
      token: user.token,
      account: user.account,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
