(function(factory){
	this.Draw = factory();
})(function(){
	function Draw(options){
		this.element = document.createElement('canvas');
		this.ctx = this.element.getContext('2d');
		
		options.id && this.element.setAttribute('id', options.id);
		options.container.appendChild(this.element);
		this.setDimension(options.width, options.height);

		this.offset = this.mapMousePosition(this.element);
		this.currentAction = 0;
		this.actions = {};

		this.bindEvent();
		this.reset();(function(factory){
	this.Draw = factory();
})(function(){
	function Draw(options){
		var defaultOptions = {
			ratio: 1,
			width: 400,
			height: 400,
			id: '',
			container: document.body
		};
		this.options = Object.setPrototypeOf(options, defaultOptions);

		this.element = document.createElement('canvas');
		this.ctx = this.element.getContext('2d');
		
		this.options.id && this.element.setAttribute('id', this.options.id);
		this.options.container.appendChild(this.element);

		defaultOptions.width = this.element.parentNode.clientWidth;
		defaultOptions.height = this.element.parentNode.clientHeight;


		if(options.ratio > 0){
			this.options.height = this.options.width / this.options.ratio;
		}
		this.setDimension(this.options.width, this.options.height);

		this.offset = this.mapMousePosition(this.element);
		this.currentAction = 0;
		this.actions = {};

		this.bindEvent();
		this.reset();
	}
	Draw.prototype.bindEvent = function(){
		this.element.addEventListener('mousedown', function(e){
			callActionByEventType.call(this, 0, e);
		}.bind(this));
		window.addEventListener('mouseup', function(e){
			callActionByEventType.call(this, 2, e);
		}.bind(this));
		this.element.addEventListener('mouseup', function(e){
			callActionByEventType.call(this, 2, e);
		}.bind(this));
		this.element.addEventListener('mousemove', function(e){
			callActionByEventType.call(this, 1, e);
		}.bind(this));

		this.element.addEventListener('touchstart', function(e){
			callActionByEventType.call(this, 0, e);
		}.bind(this));
		window.addEventListener('touchend', function(e){
			callActionByEventType.call(this, 2, e);
		}.bind(this));
		this.element.addEventListener('touchend', function(e){
			callActionByEventType.call(this, 2, e);
		}.bind(this));
		this.element.addEventListener('touchmove', function(e){
			callActionByEventType.call(this, 1, e);
		}.bind(this));

		function callActionByEventType(type, event){
			if(this.actions[this.currentAction]){
				// 计算鼠标位置
				var positionX = event.pageX, positionY = event.pageY;
				if("touches" in event && event.touches.length){
					positionX = event.touches[0].pageX;
					positionY = event.touches[0].pageY;
				}
				positionX -= this.offset.x;
				positionY -= this.offset.y;

				this.actions[this.currentAction][type] && this.actions[this.currentAction][type].call(this, event, positionX, positionY);
			}
		}
	}
	Draw.prototype.noop = function(){
		this.currentAction = 0;
	}
	Draw.prototype.reset = function(){
		// 设置默认动作和样式
		this.setStyle({
			lineWidth: 2,
			strokeStyle: '#f00'
		});
	}
	Draw.prototype.setDimension = function(width, height){
		this.element.width = width || this.element.parentNode.clientWidth;
		this.element.height = height || this.element.parentNode.clientHeight;
	}
	Draw.prototype.mapMousePosition = function(element){
		if(element){
			var offset = {x: element.offsetLeft, y: element.offsetTop}, parentNode = element.parentNode;
			if(parentNode && parentNode.tagName != "BODY"){
				var parentOffset = this.mapMousePosition(parentNode);
				offset.x += parentOffset.x;
				offset.y += parentOffset.y;
			}
			return offset;
		}
	}
	Draw.prototype.setStyle = function(options){
		this.ctx.lineWidth = options.lineWidth;
		this.ctx.strokeStyle = options.strokeStyle;
	}
	Draw.prototype.registAction = function(id, actions){
		if(!this.actions[id]){
			this.actions[id] = actions;
		}
		this.currentAction = id;
	}
	Draw.prototype.export = function(isCompress, quality){
		var imgFile;
		if(isCompress){
			// 创建导出用的canvas
			var canvasBg = this.element.cloneNode();
			var width = canvasBg.width, height = canvasBg.height;
			var ctx = canvasBg.getContext('2d');

			var imgData = this.ctx.getImageData(0, 0, width, height);
			for(var i = 0; i < imgData.data.length; i += 4){
				if(imgData.data[i + 3] < 255 * 0.6){ // 如果透明度为0，则设置为白色
					imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = imgData.data[i + 3] = 255;
				}
			}
			ctx.putImageData(imgData, 0, 0);
			imgFile = canvasBg.toDataURL('image/jpeg', quality || 1);
		}else{
			imgFile = this.element.toDataURL('image/png');
		}
		return {src: imgFile, lineWidth: this.ctx.lineWidth, width: this.options.width};
	}
	Draw.prototype.import = function(imgFile){
		var img = new Image();
		img.src = imgFile.src;
		var width = this.element.width,
			height  = width / this.options.ratio;
		img.onload = function(){
			this.ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height);
			this.ctx.lineWidth = this.options.width / imgFile.width * imgFile.lineWidth;// this.ctx.lineWidth / this.options.ratio;
		}.bind(this);
	}
	Draw.prototype.draw = function(){
		var state = 0;
		this.registAction(1, 
		[ function(e, positionX, positionY){ // mousedown
			state = 1;
			this.ctx.lineCap = 'round';
			this.ctx.beginPath();
			this.ctx.moveTo(positionX, positionY);
		},function(e, positionX, positionY){ // mousemove
			if(state == 1){
				this.ctx.lineTo(positionX, positionY);
				this.ctx.stroke();
			}
		},function(e){ // mouseup
			this.ctx.closePath();
			state = 0;
		}]);
	}
	Draw.prototype.erase = function(){
		var state = 0;
		this.registAction(2, 
		[ function(e, positionX, positionY){ // mousedown
			state = 1;
			this.ctx.lineWidth = 10;
			this.ctx.globalCompositeOperation = 'destination-out';
			this.ctx.beginPath();
			this.ctx.moveTo(positionX, positionY);
			this.ctx.stroke();
		},function(e, positionX, positionY){ // mousemove
			if(state == 1){
				this.ctx.lineTo(positionX, positionY);
				this.ctx.stroke();
			}
		},function(e){ // mouseup
			this.ctx.closePath();
			this.ctx.lineWidth = 2;
			this.ctx.globalCompositeOperation = 'source-over';
			state = 0;
		}]);
	}
	Draw.prototype.clearScreen = function(){
		this.ctx.clearRect(0, 0, this.element.width, this.element.height);
		this.reset();
	}
	return Draw;
});
	}
	Draw.prototype.bindEvent = function(){
		this.element.addEventListener('mousedown', function(e){
			callActionByEventType.call(this, 0, e);
		}.bind(this));
		window.addEventListener('mouseup', function(e){
			callActionByEventType.call(this, 2, e);
		}.bind(this));
		this.element.addEventListener('mouseup', function(e){
			callActionByEventType.call(this, 2, e);
		}.bind(this));
		this.element.addEventListener('mousemove', function(e){
			callActionByEventType.call(this, 1, e);
		}.bind(this));

		this.element.addEventListener('touchstart', function(e){
			callActionByEventType.call(this, 0, e);
		}.bind(this));
		window.addEventListener('touchend', function(e){
			callActionByEventType.call(this, 2, e);
		}.bind(this));
		this.element.addEventListener('touchend', function(e){
			callActionByEventType.call(this, 2, e);
		}.bind(this));
		this.element.addEventListener('touchmove', function(e){
			callActionByEventType.call(this, 1, e);
		}.bind(this));

		function callActionByEventType(type, event){
			if(this.actions[this.currentAction]){
				// 计算鼠标位置
				var positionX = event.pageX, positionY = event.pageY;
				if("touches" in event && event.touches.length){
					positionX = event.touches[0].pageX;
					positionY = event.touches[0].pageY;
				}
				positionX -= this.offset.x;
				positionY -= this.offset.y;

				this.actions[this.currentAction][type] && this.actions[this.currentAction][type].call(this, event, positionX, positionY);
			}
		}
	}
	Draw.prototype.noop = function(){
		this.currentAction = 0;
	}
	Draw.prototype.reset = function(){
		// 设置默认动作和样式
		this.setStyle({
			lineWidth: 2,
			strokeStyle: '#f00'
		});
	}
	Draw.prototype.setDimension = function(width, height){
		this.element.width = width || this.element.parentNode.clientWidth;
		this.element.height = height || this.element.parentNode.clientHeight;
	}
	Draw.prototype.mapMousePosition = function(element){
		if(element){
			var offset = {x: element.offsetLeft, y: element.offsetTop}, parentNode = element.parentNode;
			if(parentNode && parentNode.tagName != "BODY"){
				var parentOffset = this.mapMousePosition(parentNode);
				offset.x += parentOffset.x;
				offset.y += parentOffset.y;
			}
			return offset;
		}
	}
	Draw.prototype.setStyle = function(options){
		this.ctx.lineWidth = options.lineWidth;
		this.ctx.strokeStyle = options.strokeStyle;
	}
	Draw.prototype.registAction = function(id, actions){
		if(!this.actions[id]){
			this.actions[id] = actions;
		}
		this.currentAction = id;
	}
	Draw.prototype.export = function(isCompress, quality){
		var imgFile;
		if(isCompress){
			// 创建导出用的canvas
			var canvasBg = this.element.cloneNode();
			var width = canvasBg.width, height = canvasBg.height;
			var ctx = canvasBg.getContext('2d');

			var imgData = this.ctx.getImageData(0, 0, width, height);
			for(var i = 0; i < imgData.data.length; i += 4){
				if(imgData.data[i + 3] < 255 * 0.6){ // 如果透明度为0，则设置为白色
					imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = imgData.data[i + 3] = 255;
				}
			}
			ctx.putImageData(imgData, 0, 0);
			imgFile = canvasBg.toDataURL('image/jpeg', quality || 1);
		}else{
			imgFile = this.element.toDataURL('image/png');
		}
		return imgFile;
	}
	Draw.prototype.import = function(imgFile){
		var img = new Image();
		img.src = imgFile;
		img.width = this.element.width;
		img.onload = function(){
			this.ctx.drawImage(img, 0, 0);
		}.bind(this);
	}
	Draw.prototype.draw = function(){
		var state = 0;
		this.registAction(1, 
		[ function(e, positionX, positionY){ // mousedown
			state = 1;
			this.ctx.lineCap = 'round';
			this.ctx.beginPath();
			this.ctx.moveTo(positionX, positionY);
		},function(e, positionX, positionY){ // mousemove
			if(state == 1){
				this.ctx.lineTo(positionX, positionY);
				this.ctx.stroke();
			}
		},function(e){ // mouseup
			this.ctx.closePath();
			state = 0;
		}]);
	}
	Draw.prototype.erase = function(){
		var state = 0;
		this.registAction(2, 
		[ function(e, positionX, positionY){ // mousedown
			state = 1;
			this.ctx.lineWidth = 10;
			this.ctx.globalCompositeOperation = 'destination-out';
			this.ctx.beginPath();
			this.ctx.moveTo(positionX, positionY);
			this.ctx.stroke();
		},function(e, positionX, positionY){ // mousemove
			if(state == 1){
				this.ctx.lineTo(positionX, positionY);
				this.ctx.stroke();
			}
		},function(e){ // mouseup
			this.ctx.closePath();
			this.ctx.lineWidth = 2;
			this.ctx.globalCompositeOperation = 'source-over';
			state = 0;
		}]);
	}
	Draw.prototype.clearScreen = function(){
		this.ctx.clearRect(0, 0, this.element.width, this.element.height);
		this.reset();
	}
	return Draw;
});