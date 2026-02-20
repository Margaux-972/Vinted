const express = require("express");
const Offer = require("../models/Offer");
const router = express.Router();
const isAuthenticated = require("../middlewares/isAuthenticated");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/convertToBase64");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),

  async (req, res) => {
    try {
      // console.log("req.body =>", req.body); // => { title: 'Air Max 90' }

      const base64Image = convertToBase64(req.files.picture);

      const cloudinaryResponse = await cloudinary.uploader.upload(base64Image);

      const newOffer = new Offer({
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          { MARQUE: req.body.brand },
          { TAILLE: req.body.size },
          { ETAT: req.body.condition },
          { COULEUR: req.body.color },
          { EMPLACEMENT: req.body.city },
        ],
        // product_image: cloudinaryResponse.secure_url,
        owner: req.user,
      });
      await newOffer.populate("owner", "account");
      await newOffer.save(); // => OK
      res.json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

router.get("/offers", async (req, res) => {
  try {
    // console.log("req.query=>", req.query); // { title: 'pantalon' }
    // console.log("req.query=>", req.query); //{ sort: 'price-desc' }
    const filters = {};
    // filters.title = new RegExp(req.query.title, "i");
    // console.log(filters.title); // pantalon => version RegExp /pantalon/i
    // console.log("req.query.price =>", req.query.price);
    const regExp = new RegExp(req.query.title, "i");
    if (req.query.title) {
      filters.product_name = regExp;
    }
    if (req.query.priceMax || req.query.priceMin) {
      if (req.query.priceMax) {
        filters.product_price = { $lte: req.query.priceMax }; // on pt mettre le constructeur Number autour de req.query.priceMax pour transformer la string req.query.priceMax en nombre
      } else if (req.query.priceMin) {
        filters.product_price = { $gte: req.query.priceMin };
      } else {
        filters.product_price = {
          $lte: req.query.priceMax,
          $gte: req.query.priceMin,
        };
      }
    }
    // console.log(req.query.sort); //price-desc

    const sortedOffers = {};
    if (req.query.sort === "price-desc") {
      sortedOffers.product_price = -1;
    }

    // console.log("SO=>", sortedOffers);SO=> { product_price: -1 }

    if (req.query.sort === "price-asc") {
      sortedOffers.product_price = 1;
    }

    // console.log("req.query.page =>", req.query.page); //1
    const limit = 5;
    let skip = 0;
    // let pageFilter = 1
    // if (req.query.page){pageFilter = req.query.page}
    // skip = (pageFilter - 1) * limit
    if (req.query.page) {
      skip = (req.query.page - 1) * limit;
    }

    const count = await Offer.countDocuments(filters);
    // console.log(count);

    const offers = await Offer.find(filters)
      .sort(sortedOffers)
      .limit(limit)
      .skip(skip)
      .populate("owner", "account");

    res.json({ count: count, offers: offers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    // console.log(req.params.id); // 69970a8ea5d69249b2f86840

    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account",
    );

    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
