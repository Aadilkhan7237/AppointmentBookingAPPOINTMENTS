import { Schema } from "mongoose";


const slotsSchema=new Schema({
    date:{type:Date,required:true,unique:true},
   slots: [
    {
      slotNumber: { type: Number, required: true },      // 1-4
      remainingSpots: { type: Number, default: 2, max: 2 } // starts with 2, decreases when booked
    }
]
});

// Pre-save hook: initialize 4 slots if not already present
slotsSchema.pre("save", function(next) {
  if (!this.slots || this.slots.length === 0) {
    this.slots = [];
    for (let i = 1; i <= 4; i++) {
      this.slots.push({ slotNumber: i, remainingSpots: 2 });
    }
  }
  next();
});


export {slotsSchema};
