import { Router } from "express";
import { book,update,deleteAppointment,readAppointment,readPastAppointment } from "../controllers/appointment.controller.js";

export const appointmentRouter=Router();


appointmentRouter.route("/book").post(book);
appointmentRouter.route("/update").post(update);
appointmentRouter.route("/delete").post(deleteAppointment);
appointmentRouter.route("/upcomingAppointments").get(readAppointment);
appointmentRouter.route("/pastAppointments").get(readPastAppointment);
