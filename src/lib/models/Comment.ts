import { UserRole } from "@/types";
import { Document, Model, Schema, Types, model, models } from "mongoose";

// Comment document linked to a ticket and an author.
export interface IComment extends Document {
  ticketId: Types.ObjectId;
  authorId: Types.ObjectId;
  authorName?: string;
  authorRole?: UserRole;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String },
    authorRole: { type: String, enum: ["client", "agent"] },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const Comment: Model<IComment> =
  models.Comment || model<IComment>("Comment", CommentSchema);
