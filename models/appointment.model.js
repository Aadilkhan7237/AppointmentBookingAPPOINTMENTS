import { model } from "mongoose";
import { appointmentSchema } from "../schema/appointment.schema.js";

const appointmentModel = model("appointments", appointmentSchema);

export { appointmentModel };