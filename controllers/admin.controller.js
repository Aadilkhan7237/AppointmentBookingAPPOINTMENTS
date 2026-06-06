import { appointmentModel } from "../models/appointment.model.js"
import { slotModel } from "../models/slot.model.js";
// import { client } from "../RedisCache/client.js";

export const allAppointments = async (req, res) => {

  try {

    console.log("request received to give all appointments");
    const allAppointments = await appointmentModel.find({});

    console.log(allAppointments);
    console.log("valid response sent");
    res.status(200).json({ message: allAppointments });

  } catch (error) {
    res.status(500).json({ message: "Internal Server error" });
    console.log(error)
  }
}


export const cancelAppointment = async (req, res) => {
  const { uniqueID } = req.body;

  console.log(uniqueID);
  try {

    const existingAppointment = await appointmentModel.findOne({ uniqueID: uniqueID });

    // console.log(existingAppointment);

    if (!existingAppointment) {
      return res.status(500).json({ message: "Cancellation failed" });
    }

    existingAppointment.confirmStatus = false;

    await existingAppointment.save();

    console.log("appointment working fine");
    const slotIndex = existingAppointment.slotNumber - 1;

    const updateQuery = {
      date: existingAppointment.appointmentDate,
      [`slots.${slotIndex}.remainingSpots`]: { $lt: 2 },
    };

    const updateAction = {
      $inc: { [`slots.${slotIndex}.remainingSpots`]: 1 },
    };

    const updatedSlot = await slotModel.findOneAndUpdate(
      updateQuery,
      updateAction,
      { new: true }
    );


    // console.log(updatedSlot);

    if (!updatedSlot) {
      return res.status(500).json({ message: "Cancellation failed" });
    }


    res.status(200).json({ message: "Cancellation succeed" });



  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Cancellation failed" });
  }
}