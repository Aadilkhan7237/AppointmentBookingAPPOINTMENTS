import { appointmentModel } from "../models/appointment.model.js";
import { slotModel } from "../models/slot.model.js";
import { status } from "http-status";
// import { client } from "../RedisCache/client.js";
import { nanoid } from "nanoid";
import { bookingPublisher } from "../rabbitmq/bookingPublisher.js";

export const book = async (req, res) => {



  const {
    patientName,
    phoneNumber,
    email,
    emergencyContact,
    date,
    slotNumber,
  } = req.body;

  const { userId } = req.user;



  try {
    const uniqueID = nanoid();
    // STEP-1 checking Spot available
    const slot = Number(slotNumber);
    if (
      slot <= 0 ||
      slot > 4 ||
      !patientName ||
      !phoneNumber ||
      !date ||
      !slotNumber || !email
    ) {
      return res
        .status(status.INTERNAL_SERVER_ERROR)
        .json({ message: "Invalid data is received" });
    }



    // Ensure slot document exists If not creating one
    const availableSlot = await slotModel.findOneAndUpdate(
      { date: new Date(date) },
      {
        $setOnInsert: {
          slots: [
            { slotNumber: 1, remainingSpots: 2 },
            { slotNumber: 2, remainingSpots: 2 },
            { slotNumber: 3, remainingSpots: 2 },
            { slotNumber: 4, remainingSpots: 2 },
          ],
        },
      },
      { new: true, upsert: true }
    );

    // ATOMICALLY decrement remainingSpots if available
    const slotIndex = slot - 1;
    const updateQuery = {
      date: new Date(date),
      [`slots.${slotIndex}.remainingSpots`]: { $gt: 0 },
    };
    const updateAction = {
      $inc: { [`slots.${slotIndex}.remainingSpots`]: -1 },
    };
    const updatedSlot = await slotModel.findOneAndUpdate(
      updateQuery,
      updateAction,
      { new: true }
    );

    if (!updatedSlot) {
      return res
        .status(status.ALREADY_REPORTED)
        .json({ message: "Spot is not available" });
    }

    const numberOfSpots = updatedSlot.slots[slotIndex].remainingSpots + 1; // +1 because we just decremented

    // Try to create appointment and handle duplicate key error
    const newappointment = new appointmentModel({
      patientName: patientName,
      phoneNumber: phoneNumber,
      email: email,
      emergencyContact: emergencyContact,
      appointmentDate: new Date(date),
      bookedBy: userId,
      dateBooked: new Date(),
      slotNumber: slot,
      spot: numberOfSpots,
      uniqueID: uniqueID,
      confirmStatus: true,
    });

    try {
      await newappointment.save();
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error
        // Rollback the spot decrement and Increasing the decremented value
        await slotModel.updateOne(
          { date: date },
          { $inc: { [`slots.${slotIndex}.remainingSpots`]: 1 } }
        );
        return res
          .status(status.ALREADY_REPORTED)
          .json({ message: "appointment is already booked" });
      }
      throw err;
    }




    res.status(status.OK).json({ message: "appointment booked successfully" });

    await bookingPublisher(newappointment);
  } catch (e) {
    console.log(e);
    res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ message: `Booking failed` });
  }
};

export const update = async (req, res) => {
  const { appointmentId, newSlotNumber, newPatientName, newPhoneNumber } =
    req.body;
  console.log("----------------------------------");
  console.log(
    "appointmentID : ",
    appointmentId,
    " new slot : ",
    newSlotNumber,
    " new phone : ",
    newPhoneNumber,
    " new patien name : ",
    newPatientName
  );
  //return res.status(status.OK).json({message:"TESTING"});
  try {
    const slot = Number(newSlotNumber);
    if (
      slot < 1 ||
      slot > 4 ||
      !newSlotNumber ||
      !newPatientName ||
      !newPhoneNumber ||
      !appointmentId
    ) {
      return res
        .status(status.BAD_REQUEST)
        .json({ message: "Invalid data received" });
    }

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res
        .status(status.NOT_FOUND)
        .json({ message: "Appointment not found" });
    }


    if (appointment.confirmStatus === false) {
      return res.status(500).json({ message: "Appointment is cancelled by admin" });
    }

    const date = appointment.appointmentDate.toISOString().split("T")[0];

    if (appointment.slotNumber === slot) {
      console.log("Only other entries are updated");
      //IF the updates is not required in Slot then updating only name and phone number
      appointment.patientName = newPatientName;
      appointment.phoneNumber = newPhoneNumber;
      await appointment.save();

      return res
        .status(status.OK)
        .json({ message: "Appointment updated successfully" });
    }

    console.log(" Slot number and also Only other entries are updated");

    // Atomically decrement remainingSpots for the new slot
    const slotIndex = slot - 1;
    const updateQuery = {
      date: appointment.appointmentDate,
      [`slots.${slotIndex}.remainingSpots`]: { $gt: 0 },
    };
    const updateAction = {
      $inc: { [`slots.${slotIndex}.remainingSpots`]: -1 },
    };
    const updatedSlot = await slotModel.findOneAndUpdate(
      updateQuery,
      updateAction,
      { new: true }
    );

    if (!updatedSlot) {
      //  //IF there is conflict with slots then only update other entries
      //  appointment.patientName=newPatientName;
      //  appointment.phoneNumber=newPhoneNumber;
      //     await appointment.save();
      //   //INVALIDATING SLOTS CACHE after partial update
      //    await client.del(`slots${date}`);
      //    //INVALIDATING APPOINTMENT CACHE after partial update
      //   await client.del(`user:${appointment.bookedBy}`);
      return res
        .status(status.ALREADY_REPORTED)
        .json({ message: "Spot is not available" });
    }

    // Increment the old slot's remainingSpots to make it available for others
    const oldSlotIndex = appointment.slotNumber - 1;
    await slotModel.updateOne(
      { date: appointment.appointmentDate },
      { $inc: { [`slots.${oldSlotIndex}.remainingSpots`]: 1 } }
    );

    appointment.slotNumber = slot;
    appointment.patientName = newPatientName;
    appointment.phoneNumber = newPhoneNumber;
    try {
      await appointment.save();
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error, rollback the decrement
        await slotModel.updateOne(
          { date: appointment.appointmentDate },
          { $inc: { [`slots.${slotIndex}.remainingSpots`]: 1 } }
        );
        //ALSO ROLLBACK THE INCREMENT DONE IN OLD SLOTINDEX
        await slotModel.updateOne(
          { date: appointment.appointmentDate },
          { $inc: { [`slots.${oldSlotIndex}.remainingSpots`]: -1 } }
        );
        //      //IF there is conflict with slots then only update other entries
        //  appointment.patientName=newPatientName;
        // appointment.phoneNumber=newPhoneNumber;
        //   //INVALIDATING SLOTS CACHE after partial update
        // await client.del(`slots${date}`);
        // //INVALIDATING APPOINTMENT CACHE after partial update
        // await client.del(`user:${appointment.bookedBy}`);
        // await appointment.save();
        return res.status(status.ALREADY_REPORTED).json({
          message:
            "Appointment already exists for this slot  else entries are updated",
        });
      }
      throw err;
    }
    //INVALIDATING SLOTS CACHE

    return res
      .status(status.OK)
      .json({ message: "Appointment updated successfully" });
  } catch (e) {
    console.log(e);
    res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ message: "Appointment updation failed" });
  }
};

export const deleteAppointment = async (req, res) => {
  const { appointmentId } = req.body;


  try {
    const existingAppointment = await appointmentModel.findById(appointmentId);

    if (!existingAppointment) {
      return res
        .status(status.NOT_FOUND)
        .json({ message: "No appointment found" });
    }



    //  if(existingAppointment.confirmStatus===false){
    //   return res.status(500).json({message:"Appointment is cancelled by admin"});
    // }


    if (existingAppointment.confirmStatus === true) {

      const slotIndex = existingAppointment.slotNumber - 1;

      // console.log(existingAppointment.appointmentDate,"        ",slotIndex);

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

      if (!updatedSlot) {
        return res
          .status(status.NOT_ACCEPTABLE)
          .json({ message: "Invalid slot number" });
      }


    }

    await appointmentModel.findByIdAndDelete(appointmentId);



    //INVALIDATING SLOTS CACHE
    const date = existingAppointment.appointmentDate
      .toISOString()
      .split("T")[0];



    return res
      .status(status.OK)
      .json({ message: "Appointment deleted successfully" });
  } catch (error) {
    //console.log("Internal error occured",error);
    //console.log(error);
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ message: "Appointment deletion failed" });
  }
};

export const readAppointment = async (req, res) => {
  const { userId } = req.user;
  console.log(userId);
  // console.log("middleware passed");

  try {





    // Try cache


    // Cache miss → fetch from DB
    const allAppointments = await appointmentModel.find({ bookedBy: userId });

    const now = new Date();
    // now.setHours(0, 0, 0, 0);

    const filteredAppointments = allAppointments.filter((item) => {
      return item.appointmentDate >= now;
    });


    console.log("DB data sent");
    return res.status(status.OK).json(filteredAppointments);
  } catch (error) {
    console.error(error);
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal error occurred" });
  }
};

export const readPastAppointment = async (req, res) => {
  const { userId } = req.user;
  console.log(userId);
  //   // console.log("middleware passed");

  try {
    //   // Validate user




    // Try cache



    // Cache miss → fetch from DB
    const allAppointments = await appointmentModel.find({ bookedBy: userId });

    const filteredAppointments = allAppointments.filter((item) => {
      return item.appointmentDate < new Date(Date.now());
    });

    // Populate cache in one call
    if (filteredAppointments.length > 0) {
      filteredAppointments.sort(
        (a, b) => a.appointmentDate - b.appointmentDate
      );

    }

    console.log("DB data sent");
    return res.status(status.OK).json(filteredAppointments);
  } catch (error) {
    console.error(error);
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal error occurred" });
  }


};
