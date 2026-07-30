import { getAuth } from "firebase/auth";
try {
  getAuth(null);
} catch (e) {
  console.log(e.name, e.message);
}
