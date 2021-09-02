import toast from "react-hot-toast";
import React from "react";

export const toastClosable = (toastId: string, message: string) => (
  <div className="d-flex">
    <div className="flex items-start">
        {message}
    </div>
    <div className="flex items-end">
      <button className={'ml-2 small'} onClick={() => toast.dismiss(toastId)}> x </button>
    </div>
  </div>
)
