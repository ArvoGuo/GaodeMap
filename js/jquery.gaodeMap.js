(function($) {
	'use strict';
	var Color = {};

	(function() {
		function toRgb(color) {
			/* jshint bitwise: false */
			var rgb = color ?
				parseInt(String(color).substr(1), 16) :
				Math.floor(Math.random() * (0xFFFFFF + 1));
			return {
				r: Math.abs((rgb >> 16) & 0xFF),
				g: Math.abs((rgb >> 8) & 0xFF),
				b: Math.abs(rgb & 0xFF)
			};
		}

		function decToHex(dec) {
			var hex = dec.toString(16);
			return hex.length == 1 ? ('0' + hex) : hex;
		}

		function toHex(rgb) {
			return '#' + decToHex(rgb.r) + decToHex(rgb.g) + decToHex(rgb.b);
		}

		// Adjust color (darken when v < 0, linghten when v > 0)
		function adjustRgb(rgb, v) {
			rgb.r = Math.min(Math.max(rgb.r + v, 0), 255);
			rgb.g = Math.min(Math.max(rgb.g + v, 0), 255);
			rgb.b = Math.min(Math.max(rgb.b + v, 0), 255);
		}

		function randomColor() {
			var rgb = toRgb(Math.floor(Math.random() * (0xFFFFFF + 1)));
			adjustRgb(rgb, -50);
			return toHex(rgb);
		}

		function adjustColor(color, v) {
			var rgb = toRgb(color);
			adjustRgb(rgb, v);
			return toHex(rgb);
		}

		var colors = [
			'#321400', '#26000f', '#201f41', '#414537', '#410044',
			'#011653', '#003007', '#006045', '#57214f', '#0e4200',
			'#650000', '#000047', '#005612', '#13130e', '#000000',
			'#002027', '#003f65', '#03150e', '#032701', '#050000',
			'#000034', '#404561', '#040051', '#000054', '#001300',
			'#162203', '#341012', '#3f6700', '#435f00', '#130000'
		];
		var colorIndex = 0;

		Color.random = function() {
			var color;
			do {
				color = randomColor();
			} while (colors.indexOf(color) != -1);
			return color;
		};

		Color.reset = function() {
			colorIndex = 0;
		};

		Color.getColor = function() {
			if (!colors[colorIndex]) {
				colors[colorIndex] = Color.random();
			}
			var color = colors[colorIndex++];
			return {
				border: color,
				background: adjustColor(color, 100)
			};
		};

		Color.alpha = function(color, alpha) {
			var rgb = toRgb(color);
			return format('rgba({0}, {1}, {2}, {3})', rgb.r, rgb.g, rgb.b, alpha);
		};
	})();

	var Mapor = function(options) {
			this.init(options);
		},
		fn = Mapor.prototype;

	fn.init = function(options) {
		var self = this;
		var opts = options || {
			mapAreaId: 'iCenter',
			addBtnId: 'add',
			ulAreaId: 'list',
			center: {
				lng: 121.38064, //经度
				lat: 31.231572 //纬度
			}
		};
		self.addBtnId = opts.addBtnId;
		self.ulAreaId = opts.ulAreaId;
		self.mapAreaId = opts.mapAreaId;
		self.center = opts.center || {};
		self.polygonList = opts.polygonList || [];
		self.mapInit();
		self.showAreaInit();
	};

	fn.showAreaInit = function() {
		var self = this;
		self.addBtn = $('#' + self.addBtnId);
		self.ulArea = $('#' + self.ulAreaId);
		self.itemDemo = $('#li-demo').html();
		self.addBtn.on('click', function() {
			var newPolyon = self.newOne();
			self.reflashUlArea();
		});
	};

	fn.reflashUlArea = function() {
		var self = this;
		self.ulArea.html('');
		self.polygonList.forEach(function(value, index) {
			var opt = value.getOptions();
			var newItem = $(self.itemDemo);
			newItem
				.find('.color').css({
					'background-color': opt.fillColor,
					'opacity': '.3',
					'color': '#FFF'
				}).end()
				.find('.price').val('123').end()
				.find('.delete').on('click', function() {
					self.delOne(value);
					$(this).parent().parent().remove();
				}).end()
				.appendTo(self.ulArea);
			newItem.on('mouseenter mouseleave', function(e) {
				e.stopPropagation();
				self.checkEditable(value);
			});
		});
	};

	fn.mapInit = function() {
		var self = this;
		var toolBar;
		self.mapObj = new AMap.Map(self.mapAreaId, {
			center: new AMap.LngLat(self.center.lng, self.center.lat),
			zoom: 14
		});
		self.mapObj.plugin(["AMap.ToolBar"], function() {
			toolBar = new AMap.ToolBar();
			self.mapObj.addControl(toolBar);
		});
		self.mapObj.setFitView();
		self.mousePosition = {};
		AMap.event.addListener(self.mapObj, 'mousemove', function(e) {
			self.mousePosition = e;
		});
	};

	fn.repaintMap = function(data) {
		var self = this;
		var polygonLngLats = data.areas;
		self.mapReInit();
		self.polygonList = [];
		polygonLngLats.forEach(function(obj) {
			var path = obj.path.map(function(index) {
				return self.newPathEle({
					lng: index.lng,
					lat: index.lat
				});
			});
			self.polygonList.push(self.factoryPolygon({
				path: path
			}));
		});
	};

	fn.mapReInit = function() {
		var self = this;
		var toolBar;
		self.mapObj.clearMap();
		self.mapObj.plugin(["AMap.ToolBar"], function() {
			toolBar = new AMap.ToolBar();
			self.mapObj.addControl(toolBar);
		});
		self.mapObj.setFitView();
	};

	fn.editPolygon = function(polygon) {
		var self = this;
		var editor;
		self.mapObj.plugin(["AMap.PolyEditor"], function() {
			editor = new AMap.PolyEditor(self.mapObj, polygon);
		});
		return editor;
	};

	fn.factoryPolygon = function(opt) {
		var self = this;
		var color = Color.getColor();
		opt.map = self.mapObj;
		opt.strokeColor = color.border;
		opt.fillColor = color.background;
		opt.strokeWeight = 2;
		opt.strokeOpacity = 0.8;
		opt.fillOpacity = 0.5;
		var newPolyon = new AMap.Polygon(opt);
		setTimeout(function() {
			newPolyon = self.bindAction(newPolyon);
		}, 0);
		return newPolyon;
	};

	fn.checkEditable = function(polygon) {
		var self = this;
		var editor = polygon.editor;
		if (!polygon.getExtData().open) {
			editor.open();
			polygon.setExtData({
				open: true
			});
		} else {
			editor.close();
			polygon.setExtData({
				open: false
			});
		}
		return polygon;
	};

	fn.bindAction = function(polygon) {
		var self = this;
		var editor = self.editPolygon(polygon);
		polygon.editor = editor;
		polygon.setExtData({
			open: false
		});
		AMap.event.addListener(polygon, 'click', function() {
			if (this.getExtData().open) {
				editor.close();
				this.setExtData({
					open: false
				});
			} else {
				editor.open();
				this.setExtData({
					open: true
				});
			}
		});
		AMap.event.addListener(polygon, 'mousedown', function() {
			self.mapObj.setStatus({
				dragEnable: false,
				zoomEnable: false
			});
			var mouseLat = self.mousePosition.lnglat.lat;
			var mouseLng = self.mousePosition.lnglat.lng;
			var path = this.getOptions().path.map(function(value) {
				return {
					lat: value.lat,
					lng: value.lng
				};
			});
			var newPath;
			var _this = this;
			this.interval = setInterval(function() {
				var disLat = self.mousePosition.lnglat.lat - mouseLat;
				var disLng = self.mousePosition.lnglat.lng - mouseLng;
				newPath = path.map(function(value) {
					return self.newPathEle({
						lat: value.lat + disLat,
						lng: value.lng + disLng
					});
				});
				_this.setPath(newPath);
			}, 67);
		});
		AMap.event.addListener(polygon, 'mouseup', function() {
			self.mapObj.setStatus({
				dragEnable: true,
				zoomEnable: true
			});
			clearInterval(this.interval);
		});
		return polygon;
	};

	fn.newPathEle = function(obj) {
		return new AMap.LngLat(obj.lng, obj.lat);
	};

	fn.fromLngLatToContainerPixel = function(lng, lat) {
		var self = this;
		return self.mapObj.lnglatTocontainer(new AMap.LngLat(lng, lat));
	};

	fn.fromContainerPixelToLngLat = function(px, py) {
		var self = this;
		return self.mapObj.containTolnglat(new AMap.Pixel(px, py));
	};

	fn.newOne = function() {
		var self = this;
		var pointCenter = self.fromLngLatToContainerPixel(self.mapObj.getCenter().lng, self.mapObj.getCenter().lat);
		var newPath = [],
			len = 60;
		newPath.push(self.fromContainerPixelToLngLat(pointCenter.getX() - len, pointCenter.getY() - len));
		newPath.push(self.fromContainerPixelToLngLat(pointCenter.getX() + len, pointCenter.getY() - len));
		newPath.push(self.fromContainerPixelToLngLat(pointCenter.getX() + len, pointCenter.getY() + len));
		newPath.push(self.fromContainerPixelToLngLat(pointCenter.getX() - len, pointCenter.getY() + len));
		var color = Color.getColor();
		var newpolygon = self.factoryPolygon({
			path: newPath,
			strokeColor: color.border,
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: color.background,
			fillOpacity: 0.5
		});
		self.polygonList.push(newpolygon);
		return newpolygon;
	};

	fn.outPutData = function() {
		var self = this;
		var outData = {
			center: {
				lat: self.mapObj.getCenter().lat,
				lng: self.mapObj.getCenter().lng
			},
			areas: self.getAllInfo()
		};
		return outData;
	};

	fn.getAllInfo = function() {
		var self = this;
		return self.polygonList.map(function(polygon) {
			return self.getOneInfo(polygon);
		});
	};

	fn.getOneInfo = function(polygon) {
		var path = polygon.getPath();
		path = path.map(function(point) {
			return {
				lng: point.lng,
				lat: point.lat
			};
		});
		return {
			price: polygon.getExtData().price,
			path: path
		};
	};

	fn.delOne = function(polygon) {
		var self = this;
		var index = self.polygonList.indexOf(polygon);
		self.polygonList.splice(index, 1);
		polygon.setMap(null);
		return true;
	};
	$.Mapor = function(options) {
		return new Mapor(options);
	};
})($);