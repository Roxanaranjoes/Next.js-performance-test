// Shared toast helpers to keep messaging consistent across the app.
import { toast } from "react-toastify";

// Lightweight wrappers give us a single place to tune timing/position.
export function toastSuccess(message: string) {
  toast.success(message, { position: "top-right", autoClose: 1000 });
}

export function toastError(message: string) {
  toast.error(message, { position: "top-right", autoClose: 2500 });
}

export function toastInfo(message: string) {
  toast.info(message, { position: "top-right", autoClose: 2500 });
}
