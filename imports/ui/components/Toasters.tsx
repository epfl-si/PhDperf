import React from "react";
import toast, {Toaster} from "react-hot-toast";

export const ToasterConfig = () => {
  return (
    <Toaster
      toastOptions={{
        // Define default options
        duration: 5000,
        // Default options for specific types
        success: {
          duration: 4000,
        },
      }}
    />
  )
}

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
