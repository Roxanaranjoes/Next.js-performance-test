import { TicketPriority, TicketStatus } from "@/types";
import { Document, Model, Schema, Types, model, models } from "mongoose";

// Ticket document describing ownership and lifecycle status.
export interface ITicket extends Document {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export const Ticket: Model<ITicket> =
  models.Ticket || model<ITicket>("Ticket", TicketSchema);
