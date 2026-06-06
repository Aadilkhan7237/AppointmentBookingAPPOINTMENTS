import { Router } from "express";
import { allAppointments, cancelAppointment } from "../controllers/admin.controller.js";


export const adminAppointmentRouter=Router();


adminAppointmentRouter.route("/allAppointment").get(allAppointments);
adminAppointmentRouter.route("/cancelAppointment").post(cancelAppointment);

