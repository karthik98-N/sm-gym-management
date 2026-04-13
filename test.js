async function test() {
  try {
    const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbyLRV3dPlb4GzyZsFlov-5w3DD3FJH6BMyVJ1w0XhEcfSy54hD06_CoRb6PBoXpujU7/exec";
    const response = await fetch(`${GOOGLE_APP_URL}`); // Native GET
    const data = await response.json();
    console.log("SUCCESS:");
    console.log(data);
  } catch (err) {
    console.error("ERROR:");
    console.error(err.message);
  }
}

test();
