import { model } from "mongoose";
import { slotsSchema } from "../schema/slot.schema.js";


const slotModel=model('slots',slotsSchema);

export{slotModel};