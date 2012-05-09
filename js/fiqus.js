var directions = [[-1, 1], [-1, 0], [-1,-1], [ 0,-1], [ 1,-1], [ 1, 0], [ 1, 1]];

var Tree = function(canvas, grid_size, branchWidth, nLines, trunk_len, rad, turning_chances, splitting_chances){
	this.set_canvas(canvas);
	this.grid_size = grid_size;
	this.branchWidth = branchWidth;
	this.nLines = nLines;
	this.trunk_len = trunk_len;
	this.turning_chances = turning_chances;
	this.splitting_chances = splitting_chances;

	this.grid_total_width = Math.floor(this.width / this.grid_size) * this.grid_size;
	this.grid_total_height = Math.floor(this.height / this.grid_size) * this.grid_size;

	this.base_x = this.width/2 - this.grid_total_width/2;
	this.base_y = this.height/2 - this.grid_total_height/2;

	this.rows = this.grid_total_height/this.grid_size;
	this.cols = this.grid_total_width/this.grid_size;

	this.radius = Math.abs((Math.min(this.cols+1, this.rows+1)/2) * rad);
	this.center = [(this.cols + 1 )/ 2, (this.rows + 1)/2];

	this.back_color = '#FFFFFF';
	this.fore_color = '#000000';
};

Tree.prototype.set_canvas = function(c) {
	this.canvas = c;
	this.ctx = c.getContext("2d");
	this.width = c.width;
	this.height = c.height;
};

Tree.prototype.generate = function() {
	//inicializo la matriz;
	this.matrix = [];
	for(var i=0;i<this.cols+1;i++){
		this.matrix[i] = [];
	}

	this.drawn_squares = [];
	for(i=0;i<this.cols;i++){
		this.drawn_squares[i] = [];
	}
};



Tree.prototype.can_draw = function(point_from, n_direction) {
	if(n_direction < 0){
		return false;
	}if(n_direction >= directions.length){
		return false;
	}

	var next_point = [point_from[0] + directions[n_direction][0],point_from[1] + directions[n_direction][1]];
	if(next_point[0] < 0 || next_point[0] > this.cols){
		return false;
	}
	if(next_point[1] < 0 || next_point[1] > this.rows+1){
		return false;
	}
	if(this.matrix[next_point[0]][next_point[1]] !== undefined){
		return false;
	}
	if(Math.sqrt(Math.pow(this.center[0] - next_point[0],2) + Math.pow(this.center[1] - next_point[1],2)) > this.radius){
		return false;
	}
	
	var dir = directions[n_direction];

	if(Math.abs(dir[0])> 0 && Math.abs(dir[1])> 0){ /*si es diagonal*/
		if(this.drawn_squares[Math.min(point_from[0], next_point[0])][Math.min(point_from[1], next_point[1])]){
			return false;
		}
	}

	return true;
};


Tree.prototype.get_checked_direction = function(point_from, n_direction){
	var possible_directions = [];
	if(Math.random() < this.turning_chances){
		if(Math.random() < 0.5){
			possible_directions = [n_direction+1, n_direction-1, n_direction];
		}else{
			possible_directions = [n_direction-1, n_direction+1, n_direction];
		}
	}else{
		if(Math.random() < 0.5){
			possible_directions = [n_direction, n_direction-1, n_direction+1];
		}else{
			possible_directions = [n_direction, n_direction+1, n_direction-1];
		}
	}
	for (var i = 0; i < possible_directions.length; i++) {
		if(this.can_draw(point_from, possible_directions[i])){
			return possible_directions[i];
		}
	}
	return;
};

Tree.prototype.draw = function() {
	var drawing = true;
	var n = 0;

	this.ctx.fillStyle = this.back_color;
	this.ctx.strokeStyle = this.fore_color;

	this.ctx.fillRect(0,0,this.width,this.height);

	var puntos = [];
	for(i=0;i<this.nLines;i++){
		var p = [this.cols - Math.floor((this.cols+1)/2) - Math.floor(this.nLines/2) + i , this.rows-2 ];
		puntos.push(p);
		this.matrix[p[0]][p[1]] = 3; //direccion para arriba

	}

	while (drawing){
		drawing = false;
		var l = puntos.length;
		for (i = 0; i < l; i++) {
			var punto_prev = puntos[i];
			if(!punto_prev){
				continue;
			}
			var direccion = this.matrix[punto_prev[0]][punto_prev[1]];
			if(n == this.trunk_len){ /*termine el tronco, hago que se abran las ramas*/
				if(i < puntos.length/3 - 1){
					direccion = 2;
				}else if(i > 2 * puntos.length/3){
					direccion = 4;
				}
			}else if(n > this.trunk_len){/*las ramas*/
				direccion = this.get_checked_direction(punto_prev, direccion);
				if(direccion === undefined){
					puntos[i] = false;
					this.ctx.beginPath();
					this.ctx.arc(this.base_x + this.grid_size * punto_prev[0],
						this.base_y + this.grid_size * punto_prev[1],
						this.branchWidth, 0, 2*Math.PI);
					this.ctx.fill();
					this.ctx.stroke();
					continue;
				}if(Math.random() < this.splitting_chances){/*nueva rama*/
					puntos.push(punto_prev);
				}
			}

			var dir = directions[direccion];
			var punto_next = [punto_prev[0] + dir[0], punto_prev[1] + dir[1]];

			this.matrix[punto_next[0]][punto_next[1]] = direccion;
			puntos[i] = punto_next;

			this.ctx.beginPath();
			this.ctx.moveTo(this.base_x + this.grid_size * punto_prev[0],this.base_y + this.grid_size * punto_prev[1]);
			this.ctx.lineTo(this.base_x + this.grid_size * punto_next[0],this.base_y + this.grid_size * punto_next[1]);
			this.ctx.strokeStyle = this.fore_color;
			if(n < this.trunk_len/3){
				this.ctx.lineWidth = this.branchWidth * 2;
			}else{
				this.ctx.lineWidth = this.branchWidth;
			}
			this.ctx.stroke();

			if(Math.abs(dir[0])> 0 && Math.abs(dir[1])> 0){ /*si es diagonal*/
				this.drawn_squares[Math.min(punto_prev[0], punto_next[0])][Math.min(punto_prev[1], punto_next[1])] = true;
			}

			drawing = true;
		}
		n++;
	}
};