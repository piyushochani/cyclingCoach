/** Clear auth localStorage before starting a fresh signup flow. */
export function clearSignupStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("cyclogenai_user");
  localStorage.removeItem("cyclogenai_token");
  localStorage.removeItem("cyclogenai_signed_in");
  localStorage.removeItem("cyclogenai_session_ts");
}
