import { defaultSerializeError } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// portals procedure:

// create a component
// create a variable using useRef
// create-element using the document.createElement("div")
// and set it to variable if its null
// now useEffect will add the created  element to the model that
// is the new div with the modal so that it will pop up before the others
//first get the models root with the id
// clean up function should be given since we are giving the element




// NOTE:
// this is a reuseable model component 


export default function Model(props) {
  const elRef = useRef(null);
  if (!elRef.current) {
    elRef.current = document.createElement("div");
  }

  useEffect(() => {
    const modalRoot = document.getElementById("modal");
    modalRoot.appendChild(elRef.current);

    return () => {
      modalRoot.removeChild(elRef.current);
    };
  }, []);
  return createPortal(<div>{props.children}</div>, elRef.current);
}
