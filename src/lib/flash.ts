import { cookies } from "next/headers";

export type FlashMessage = {
  type: "success" | "error";
  message: string;
};

const FLASH_COOKIE = "rff_flash";

export async function setFlashMessage(type: FlashMessage["type"], message: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    FLASH_COOKIE,
    JSON.stringify({ type, message }),
    {
      sameSite: "lax",
      path: "/",
      maxAge: 60,
    },
  );
}

export async function consumeFlashMessage(): Promise<FlashMessage | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(FLASH_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as FlashMessage;
    if (!parsed || (parsed.type !== "success" && parsed.type !== "error") || !parsed.message) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
