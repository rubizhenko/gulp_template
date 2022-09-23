import debounce from "lodash/debounce";
import { WIN } from "./constants";

type LayoutDataType = {
	windowWidth: number;
};
type LayoutSettingType = {
	afterResize?: (L: LayoutDataType) => void;
	onInit?: (L: LayoutDataType) => void;
};

const Layout = (function () {
	"use strict";
	//#region Private methods
	let L: LayoutDataType = {
		windowWidth: 0,
	};
	let SETTINGS: LayoutSettingType = {
		afterResize: () => {},
		onInit: () => {},
	};
	function getLayout(): LayoutDataType {
		const WIN_WIDTH = WIN.width() || 0;

		return { windowWidth: WIN_WIDTH };
	}
	function resizeHandler() {
		WIN.on(
			"resize",
			debounce(function () {
				L = getLayout();
				if (SETTINGS.afterResize) {
					SETTINGS.afterResize(L);
				}
			}, 100)
		);
	}
	//#endregion

	return {
		//#region Public methods
		layoutHandler: function (settings: LayoutSettingType) {
			if (settings) {
				SETTINGS = { ...SETTINGS, ...settings };
			}
			L = getLayout();
			if (SETTINGS.onInit) {
				SETTINGS.onInit(L);
			}
			resizeHandler();
		},
		//#endregion
	};
})();

export default Layout;
