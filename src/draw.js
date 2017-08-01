(function(factory) {
	this.Draw = factory();
})(function() {
	function Event(){
		this.events = {};
	}
	Event.prototype.on = function(eventName, cb){
		if(!this.events[eventName]){
			this.events[eventName] = [];
		}
		this.events[eventName].push(cb);
	};
	Event.prototype.trigger = function(eventName, data){
		var cbs = this.events[eventName];
		if(cbs){
			for(var i = 0; i < cbs.length; i++){
				cbs[i](data);
			}
		}
	};
	Event.prototype.unbind = function(eventName, cb){
		var cbs = this.events[eventName];
		if(cbs){
			for(var i = cbs.length - 1; i >= 0; i--){
				if(cbs[i] === cb){
					cbs.splice(i, 1);
				}
			}
		}
	};

	function Draw(options) {
		Event.call(this);

		var defaultOptions = {
			ratio: 0,
			width: 400,
			height: 400,
			id: '',
			container: document.body
		};
		this.options = Object.setPrototypeOf(options, defaultOptions);

		this.element = document.createElement('canvas');
		this.ctx = this.element.getContext('2d');

		if (this.options.id) {
			this.element.setAttribute('id', this.options.id);
		}
		this.options.container.appendChild(this.element);

		defaultOptions.width = this.element.parentNode.clientWidth;
		defaultOptions.height = this.element.parentNode.clientHeight;

		/************ 抗锯齿处理 ************/
		this.ctx.translate(0.5, 0.5);
		// this.ctx.shadowColor = 'black';
		// this.ctx.shadowBlur = 4;

		if (options.ratio > 0) {
			this.options.height = this.options.width / this.options.ratio;
		}

		this.countOffset();
		this.currentAction = 0;
		this.actions = {};

		this.bindEvent();
		this.reset();
	}
	Draw.prototype = Object.create(Event.prototype);

	Draw.prototype.bindEvent = function() {
		// 鼠标事件
		this.element.addEventListener('mousedown', function(e) {
			if(e.button === 0){ // 左键触发功能
				callActionByEventType.call(this, 0, e);
				this.trigger('mousedown', e);
			}
		}.bind(this));
		this.element.addEventListener('mousemove', function(e) {
			if(e.button === 0){
				callActionByEventType.call(this, 1, e);
				this.trigger('mousemove', e);
			}
		}.bind(this));
		this.element.addEventListener('mouseup', function(e) {
			if(e.button === 0){
				callActionByEventType.call(this, 2, e);
				this.trigger('mouseup', e);
			}
		}.bind(this));
		window.addEventListener('mouseup', function(e) {
			if(e.button === 0){
				callActionByEventType.call(this, 2, e);
				this.trigger('mouseup', e);
			}
		}.bind(this));

		// 触屏事件
		this.element.addEventListener('touchstart', function(e) {
			callActionByEventType.call(this, 0, e);
			this.trigger('touchstart', e);
		}.bind(this));
		this.element.addEventListener('touchmove', function(e) {
			callActionByEventType.call(this, 1, e);
			this.trigger('touchmove', e);
		}.bind(this));
		this.element.addEventListener('touchend', function(e) {
			callActionByEventType.call(this, 2, e);
			this.trigger('touchend', e);
		}.bind(this));
		window.addEventListener('touchend', function(e) {
			callActionByEventType.call(this, 2, e);
			this.trigger('touchend', e);
		}.bind(this));


		// 由于外部事件导致失去焦点，如快捷键截图
		this.element.addEventListener('mouseout', function(e) {
			callActionByEventType.call(this, 2, e);
			this.trigger('blur', e);
		}.bind(this));
		window.addEventListener('blur', function(e) {
			callActionByEventType.call(this, 2, e);
			this.trigger('blur', e);
		}.bind(this));
		window.addEventListener('touchcancel', function(e) {
			callActionByEventType.call(this, 2, e);
			this.trigger('blur', e);
		}.bind(this));
		this.element.addEventListener('touchcancel', function(e) {
			callActionByEventType.call(this, 2, e);
			this.trigger('blur', e);
		}.bind(this));

		function callActionByEventType(type, event) {
			if (this.actions[this.currentAction]) {
				// 计算鼠标位置
				var positionX = event.pageX,
					positionY = event.pageY;
				if ("touches" in event && event.touches.length) {
					positionX = event.touches[0].pageX;
					positionY = event.touches[0].pageY;
				}
				positionX -= this.offset.x;
				positionY -= this.offset.y;

				if (this.actions[this.currentAction][type]) {
					this.actions[this.currentAction][type].call(this, event, positionX, positionY);
				}
			}
		}
	};
	Draw.prototype.noop = function() {
		this.currentAction = 0;
	};
	Draw.prototype.reset = function() {
		this.setDimension(this.options.width, this.options.height);
		// 设置默认动作和样式
		this.setStyle({
			lineWidth: this.options.lineWidth || this.ctx.lineWidth,
			strokeStyle: this.options.strokeStyle || this.ctx.strokeStyle,
			lineJoin: 'round'
		});
	};
	Draw.prototype.setDimension = function(width, height) {
		this.element.width = width || this.element.parentNode.clientWidth;
		this.element.height = height || this.element.parentNode.clientHeight;
	};
	Draw.prototype.mapMousePosition = function(element) {
		if (element) {
			var offset = {
					x: element.offsetLeft,
					y: element.offsetTop
				},
				parentNode = element.parentNode;
			if (parentNode && parentNode.tagName != "BODY") {
				var parentOffset = this.mapMousePosition(parentNode);
				offset.x += parentOffset.x;
				offset.y += parentOffset.y;
			}
			return offset;
		}
	};
	Draw.prototype.countOffset = function() {
		this.offset = this.mapMousePosition(this.element);
	};
	Draw.prototype.setStyle = function(options) {
		if (options.strokeStyle) {
			this.ctx.strokeStyle = options.strokeStyle;
		}
		if (options.lineJoin) {
			this.ctx.lineJoin = options.lineJoin;
		}
		if (options.lineWidth > 0) {
			this.ctx.lineWidth = options.lineWidth;
		}
		/************ 抗锯齿处理 ************/
		// if (options.lineWidth > 0) {
		// 	var lineWidth = options.lineWidth,
		// 		shadowSize = 0;
		// 	var tmpWidth = lineWidth - shadowSize * 2;
		// 	if (tmpWidth <= 0) {
		// 		this.ctx.lineWidth = 1;
		// 	} else {
		// 		this.ctx.lineWidth = tmpWidth;
		// 	}
		// 	this.ctx.shadowBlur = (lineWidth - this.ctx.lineWidth) / 2;
		// }
		// this.ctx.shadowColor = this.ctx.strokeStyle;
	};
	Draw.prototype.registAction = function(id, actions) {
		if (!this.actions[id]) {
			this.actions[id] = actions;
		}
		this.currentAction = id;
	};
	Draw.prototype.export = function(isCompress, quality) {
		var imgFile;
		if (isCompress) {
			// 创建导出用的canvas
			var canvasBg = this.element.cloneNode();
			var width = canvasBg.width,
				height = canvasBg.height;
			var ctx = canvasBg.getContext('2d');

			var imgData = this.ctx.getImageData(0, 0, width, height);
			for (var i = 0; i < imgData.data.length; i += 4) {
				if (imgData.data[i + 3] < 255 * 0.6) { // 如果透明度为0，则设置为白色
					imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = imgData.data[i + 3] = 255;
				}
			}
			ctx.putImageData(imgData, 0, 0);
			imgFile = canvasBg.toDataURL('image/jpeg', quality || 1);
		} else {
			imgFile = this.element.toDataURL('image/png');
		}
		return {
			src: imgFile,
			lineWidth: this.ctx.lineWidth,
			width: this.options.width
		};
	};
	Draw.prototype.import = function(imgFile) {
		var img = new Image();
		img.src = imgFile.src;
		var width = this.element.width,
			height = width / this.options.ratio;
		img.onload = function() {
			this.ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height);
			// this.ctx.lineWidth = this.options.width / imgFile.width * imgFile.lineWidth;// this.ctx.lineWidth / this.options.ratio;
		}.bind(this);
	};
	Draw.prototype.draw = function() {
		var state = 0, prePosition = {x: 0, y: 0};
		this.registAction(1, [function(e, positionX, positionY) { // mousedown
			state = 1;
			this.ctx.lineCap = 'round';
			// this.ctx.beginPath();
			this.ctx.moveTo(positionX, positionY);
			this.ctx.lineTo(positionX, positionY);
			prePosition.x = positionX;
			prePosition.y = positionY;
			this.ctx.stroke();
		}, function(e, positionX, positionY) { // mousemove
			if (state == 1) {
				this.ctx.beginPath();
				// ctx.moveTo(20,20);
				/************ 贝塞尔曲线抗锯齿处理 ************/
				this.ctx.moveTo(prePosition.x, prePosition.y);
				// this.ctx.lineTo(positionX, positionY);
				this.ctx.quadraticCurveTo((prePosition.x + positionX) / 2, (prePosition.y + positionY) / 2, positionX, positionY);
				prePosition.x = positionX;
				prePosition.y = positionY;
				this.ctx.stroke();
				this.ctx.closePath();
			}
		}, function(e) { // mouseup
			// this.ctx.closePath();
			state = 0;
		}]);
	};
	Draw.prototype.erase = function() {
		var state = 0,
			tmpLineWidth;
		this.registAction(2, [function(e, positionX, positionY) { // mousedown
			state = 1;
			tmpLineWidth = this.ctx.lineWidth;
			this.ctx.lineWidth = 53;
			this.ctx.globalCompositeOperation = 'destination-out';
			this.ctx.beginPath();
			this.ctx.moveTo(positionX, positionY);
			this.ctx.lineTo(positionX, positionY);
			this.ctx.stroke();
		}, function(e, positionX, positionY) { // mousemove
			if (state == 1) {
				this.ctx.lineTo(positionX, positionY);
				this.ctx.stroke();
			}
		}, function(e) { // mouseup
			this.ctx.closePath();
			this.ctx.lineWidth = tmpLineWidth;
			this.ctx.globalCompositeOperation = 'source-over';
			state = 0;
		}]);
	};
	Draw.prototype.clearScreen = function() {
		this.ctx.clearRect(0, 0, this.element.width, this.element.height);
	};
	return Draw;
});