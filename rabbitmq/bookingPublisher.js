import { sendMail } from "./mailHelper.js";




const times = ["10:00AM", "12:00PM", "02:00PM", "04:00PM"];

export const bookingPublisher = async (appointment) => {

  try {



    const appointmentdate = new Date(appointment.appointmentDate)
      .toUTCString()
      .slice(5, 16);
    const bookingDate = new Date(appointment.dateBooked)
      .toUTCString()
      .slice(5, 16);

    // console.log(appointmentdate);
    //  console.log(bookingDate);
    const body = appointmentConfirmationTemplate(
      appointment.patientName.toUpperCase(),
      appointment.phoneNumber,
      appointmentdate,
      times[appointment.slotNumber - 1],
      bookingDate
    );

    const message = {
      email: appointment.email,
      msg: body,
      subject: "Booking Confirmation",
    }





    await sendMail(message);

  } catch (error) {
    console.log(error);
  }
}





const appointmentConfirmationTemplate = (patientName, phoneNumber, appointmentDate, slotTime, bookingDate
) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Appointment Confirmation</title>
    <style>
      /* Basic responsiveness for mobile */
      @media only screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          padding: 10px !important;
        }
        .content {
          padding: 16px !important;
        }
        table {
          font-size: 14px !important;
        }
        h2 {
          font-size: 20px !important;
        }
      }
    </style>
  </head>

  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fb; margin: 0; padding: 0;">
    <div class="container" style="max-width: 600px; background-color: #ffffff; margin: 20px auto; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
      
      <div style="background-color: #007bff; padding: 16px; color: #ffffff; text-align: center;">
        <h2 style="margin: 0;">MK Hospital, Jhansi</h2>
        <p style="margin: 4px 0;">Appointment Confirmation</p>
      </div>

      <div class="content" style="padding: 24px; color: #333333;">
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your appointment has been <strong>successfully booked!</strong> 🎉</p>
        
        <div style="margin-top: 20px;">
          <h3 style="color: #007bff; margin-bottom: 10px;">Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">🧍 <strong>Patient Name</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${patientName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">📞 <strong>Phone Number</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${phoneNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">📅 <strong>Appointment Date</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${appointmentDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">⏰ <strong>Time Slot</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${slotTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px;">🗓️ <strong>Booking Date</strong></td>
              <td style="padding: 8px;">${bookingDate}</td>
            </tr>
          </table>
        </div>

        <p style="margin-top: 20px;">Please arrive <strong>10–15 minutes early</strong> for your appointment.</p>
        <p>If you need to reschedule or cancel, please contact us or use your account dashboard.</p>

        <p style="margin-top: 20px;">Thank you for choosing <strong>MK Hospital, Jhansi</strong>.<br>
        We look forward to seeing you!</p>

        <p style="margin-top: 20px; font-size: 14px; color: #555;">Best regards,<br>
        <strong>Team MK Hospital Jhansi</strong><br>
        📧 support@mkhopedialysisunit@gmail.com</p>
      </div>
    </div>
  </body>
  </html>
`;