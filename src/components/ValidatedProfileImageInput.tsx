"use client";

import { ChangeEvent, useState } from "react";

const MAX_PROFILE_IMAGE_BYTES = 700 * 1024;

type ValidatedProfileImageInputProps = {
  className?: string;
  inputName?: string;
  maxBytes?: number;
};

export function ValidatedProfileImageInput({
  className,
  inputName = "profileImage",
  maxBytes = MAX_PROFILE_IMAGE_BYTES,
}: ValidatedProfileImageInputProps) {
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selectedFile = input.files?.[0];

    if (!selectedFile) {
      input.setCustomValidity("");
      setError(null);
      return;
    }

    if (selectedFile.size > maxBytes) {
      const message = "Profile image must be 700KB or smaller.";
      input.setCustomValidity(message);
      input.reportValidity();
      setError(message);
      return;
    }

    input.setCustomValidity("");
    setError(null);
  }

  return (
    <>
      <input className={className} name={inputName} type="file" accept="image/*" onChange={handleChange} />
      {error ? (
        <p style={{ margin: "0.2rem 0 0", color: "#9d1f2d", fontSize: "0.85rem" }} role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
