const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><p>Hello world</p>', { url: "http://localhost:3000" });
const window = dom.window;
window.postMessage("test", "https://app-cdn.minepi.com");
