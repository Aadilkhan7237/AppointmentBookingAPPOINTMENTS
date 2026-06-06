import { Router } from "express";
import { slots,dates } from "../controllers/slots.controller.js";


export const slotRouter=Router();


slotRouter.route("/getSlots").post(slots);
slotRouter.route("/getDates").get(dates);