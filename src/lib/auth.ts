import { getRepository } from "@/lib/sheets";

export async function verifyKidPin(kidId: string, pin: string) {
  const repository = getRepository();
  return repository.verifyKidPin(kidId, pin);
}
