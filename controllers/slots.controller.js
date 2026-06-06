import status from "http-status";
import { slotModel } from "../models/slot.model.js";
// import { client } from "../RedisCache/client.js"; 
import { nanoid } from 'nanoid'

export const slots = async (req, res) => {
  const { date } = req.body;

  try {


    const allSlots = await slotModel.findOne({ date: new Date(date) });

    let data;
    //IF invalid date is encountered setting artificial data
    if (allSlots) {
      data = allSlots.slots.map((s) => s.remainingSpots.toString());

      data = data.map((item) => {
        return {
          slots: item,
          id: nanoid(),
        }
      })
    } else {
      console.log("Artificial data sent");
      data = [
        {
          slots: "2",
          id: nanoid(),
        },
        {
          slots: "2",
          id: nanoid(),
        },
        {
          slots: "2",
          id: nanoid(),
        },
        {
          slots: "2",
          id: nanoid(),
        }];
    }

    console.log(data);





    console.log("DB data sent");
    res.status(status.OK).json(data);
  } catch (error) {
    res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal error occurred" });
  }
};

export const dates = async (req, res) => {

  console.log("Dates requested");
  const allDate = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dateUTCStr = d.toUTCString();
    const dayName = dateUTCStr.slice(0, 3);

    const dateISOstr = d.toISOString();

    const completeDate = dateISOstr.slice(0, 10);

    const monthStr = dateISOstr.slice(5, 7);

    const dateStr = dateISOstr.slice(8, 10);

    allDate.push({
      day: dayName,
      date: dateStr,
      month: monthStr,
      fullDate: completeDate,
      id: nanoid(),
    });
  }





  // console.log(expireAt);

  //console.log(allDate);
  console.log("Genrated dates");
  res.status(status.OK).json(allDate);
};

function getMidnightISTTimestamp() {
  const now = new Date();

  // Current time in IST
  const istOffset = 5.5 * 60; // minutes
  const localOffset = now.getTimezoneOffset(); // minutes (UTC - local)

  // Convert to IST by shifting
  const istDate = new Date(
    now.getTime() + (istOffset + localOffset) * 60 * 1000
  );
  // Set IST time to tomorrow 00:00:00
  istDate.setDate(istDate.getDate() + 1);
  istDate.setHours(0, 0, 0, 0);

  // Convert back to UTC timestamp (Redis expects UTC seconds)
  return Math.floor(istDate.getTime() / 1000);
}
