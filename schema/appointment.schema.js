import { Schema } from "mongoose";


const appointmentSchema=new Schema({
     patientName:{type:String,required:true},
     phoneNumber:{type:Number,required:true},
     email:{type:String},
     emergencyContact:{type:String},
     appointmentDate:{type:Date,required:true},
     bookedBy:{type:String, required:true},
     dateBooked:{type:Date,required:true},
     slotNumber:{type:Number,required:true},
     spot:{type:Number,required:true},
     uniqueID:{type:String,required:true},
     confirmStatus:{type:Boolean,required:true},
     
});

appointmentSchema.index(
  { appointmentDate: 1, slotNumber: 1, spot: 2 },
   
);




export {appointmentSchema};