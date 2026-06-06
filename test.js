import mongoose from "mongoose";

mongoose.connect("mongodb+srv://aadiluser2005_db_user:Aadilkhan01@cluster0.fbdbqvh.mongodb.net/")
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch(err => {
    console.log("Connection Failed:", err.message);
  });
