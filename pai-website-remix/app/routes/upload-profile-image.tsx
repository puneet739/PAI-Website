import type { Route } from "./+types/upload-profile-image";
import { redirect } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const { requireUserId } = await import("~/lib/session.server");
  const { query } = await import("~/lib/db.server");
  
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const imageFile = formData.get("profileImage");

  if (!imageFile || !(imageFile instanceof File)) {
    return { error: "Please select an image file" };
  }

  // Validate file type
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validTypes.includes(imageFile.type)) {
    return { error: "Only JPG, PNG, and WebP images are allowed" };
  }

  // Validate file size (max 2MB for passport size)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (imageFile.size > maxSize) {
    return { error: "Image size must be less than 2MB" };
  }

  // Convert image to base64
  const arrayBuffer = await imageFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`;

  // Update user profile image in database
  await query(
    "UPDATE members SET profile_image = ? WHERE id = ?",
    [base64Image, userId]
  );

  return redirect("/dashboard?image=updated");
}
