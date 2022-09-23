export default class DynamicFavicon {
	/**
	 * current icon
	 */
	current: number;

	/**
	 * total favicons to animate
	 */
	totalIcons;

	/**
	 * favicons imgs dataUrls
	 */
	icons: string[];

	/**
	 * favicons urls to animate
	 */
	favicon: HTMLLinkElement | null;

	/**
	 * favicon animation speed interval
	 */
	interval: number;

	constructor({ interval }: { interval?: number }) {
		this.current = 0;
		this.totalIcons = 2;
		this.icons = [];
		this.interval = interval || 120;
		this.favicon = document.getElementById(
			"dynamicFavicon"
		) as HTMLLinkElement | null;

		this.loadImgs();
		this.animate();
	}

	private loadImgs() {
		const _this = this;
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (ctx) {
			canvas.height = canvas.width = 64;
			for (let i = 0; i < this.totalIcons; i++) {
				const img = new Image();
				img.onload = function () {
					ctx.drawImage(img, 0, 0, 64, 64);
					_this.icons[i] = canvas.toDataURL("image/png");
				};
				img.src = `/favicon/favicon-${i}.png`;
			}
		}
	}

	animate() {
		const _this = this;
		setInterval(function () {
			if (!_this.favicon) return;
			// Determine the next icon
			let icon = ++_this.current % _this.totalIcons;
			// Grab the URL to use
			let url = _this.icons[icon];
			// Update your elements
			_this.favicon.href = url;
		}, _this.interval);
	}
}
