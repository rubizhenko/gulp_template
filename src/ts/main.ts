import { LAYOUT } from "./modules/constants";
import Layout from "./modules/Layout";

$(function () {
	Layout.layoutHandler({
		onInit: (layout) => {
			if (layout.windowWidth <= LAYOUT.mobileScreenWidth) {
				console.log("Mobile view");
			}
		},
		afterResize: (layout) => {
			if (layout.windowWidth <= LAYOUT.mobileScreenWidth) {
				console.log("Mobile view");
			} else {
				console.log("Desktop view");
			}
		},
	});
});

window.addEventListener("load", function () {
	document.querySelector("body")?.classList.remove("loading");
	// Init app modules after loading
});
