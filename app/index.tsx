import { getAccessToken } from "@/utils/auth";
import { Redirect } from "expo-router";
export default function Index() {
  const token = getAccessToken();
  if (token != null) {
    return <Redirect href="/(tabs)/home" />;
  }
  return <Redirect href="/login" />;
}
