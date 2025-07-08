import Mellowtel from "mellowtel";

(async () => {
  const mellowtel = new Mellowtel("YOUR_CONFIGURATION_KEY"); // Replace with your configuration key
  await mellowtel.initContentScript();
})();
